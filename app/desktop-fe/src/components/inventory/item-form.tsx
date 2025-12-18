'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem } from '@/types/inventory';
import { lookupByUpc } from '@/lib/inventory-api';
import { Camera, Loader2, ScanLine, X } from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls, Result } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import styles from './item-form.module.scss';
import { useI18n } from '@/lib/i18n';

interface ItemFormProps {
  item: InventoryItem | null;
  onSubmit: (item: InventoryItem | Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

export function ItemForm({ item, onSubmit, onCancel }: ItemFormProps) {
  const { t } = useI18n();
  const DISCRETE_UNITS = new Set(['pieces', 'boxes', 'cans', 'bottles']);
  const isDiscreteUnit = (unit: string) => DISCRETE_UNITS.has(unit);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const reader = useMemo(() => {
    const r = new BrowserMultiFormatReader();
    // Improve detection reliability for UPC/EAN by trying harder and limiting formats
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    r.setHints(hints as unknown as Map<DecodeHintType, unknown>);
    return r;
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: 'kg',
    minStock: 0,
    price: 0,
    supplier: '',
  });

  const [upcValue, setUpcValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        price: item.price,
        supplier: item.supplier,
      });
      setUpcValue('');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      onSubmit({ ...item, ...formData });
    } else {
      onSubmit(formData);
    }
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      unit: 'kg',
      minStock: 0,
      price: 0,
      supplier: '',
    });
    setUpcValue('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let nextVal: string | number = value;
      if (name === 'unit') {
        // when unit changes, keep quantity/minStock integer if discrete
        const discrete = isDiscreteUnit(value);
        return {
          ...prev,
          unit: value,
          quantity: discrete ? Math.floor(Number(prev.quantity) || 0) : Number(prev.quantity) || 0,
          minStock: discrete ? Math.floor(Number(prev.minStock) || 0) : Number(prev.minStock) || 0,
        };
      }

      if (name === 'quantity' || name === 'minStock') {
        const discrete = isDiscreteUnit(prev.unit);
        const num = discrete ? Math.floor(Number(value) || 0) : parseFloat(value) || 0;
        nextVal = Math.max(0, num);
      } else if (name === 'price') {
        nextVal = Math.max(0, parseFloat(value) || 0);
      }

      return {
        ...prev,
        [name]: nextVal,
      };
    });
  };

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
        // Prompt for permission to get accurate labels and device list
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch {}
        const list = await reader.listVideoInputDevices();
        setDevices(list);
        // Prefer back-facing camera on mobile by label heuristic
        const preferred = list.find(d => /back|rear|environment/i.test(d.label)) || list[0];
        setSelectedDeviceId(preferred?.deviceId);
      } catch {
        // silently ignore; UI will still allow manual UPC entry
      }
    };
    loadDevices();
  }, [reader]);

  const startScanner = () => {
    setLookupError(null);
    // Check for secure context: camera requires HTTPS or localhost
    const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.hostname === 'localhost');
    if (!isSecure) {
      setCameraNotice(t('inventory.form.cameraNotice', 'Camera requires HTTPS or localhost. Please use https:// or run locally.'));
      return;
    }
    setScanning(true);
    setShowScannerModal(true);
  };

  const handleLookup = useCallback(async (code?: string) => {
    const upc = (code ?? upcValue).trim();
    if (!upc) return;
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await lookupByUpc(upc);
      if (!res?.success) {
        setLookupError(res?.error || t('inventory.form.barcodeNotFound', 'Barcode not found'));
        return;
      }
      const data = res.data || {};
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        category: data.category || prev.category,
        supplier: data.brand || prev.supplier,
      }));
    } catch (error: unknown) {
      console.error('UPC lookup failed', error);
      setLookupError(t('inventory.form.lookupFailed', 'Lookup failed. Please try again.'));
    } finally {
      setLookupLoading(false);
    }
  }, [t, upcValue]);

  useEffect(() => {
    const runScanner = async () => {
      if (!showScannerModal || !videoRef.current) return;
      try {
        // Prefer explicit constraints; deviceId when chosen, else environment facing
        const constraints: MediaStreamConstraints = selectedDeviceId
          ? { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result: Result | undefined, err: unknown, controlsInstance: IScannerControls | undefined) => {
            controlsRef.current = controlsInstance || null;
            if (result?.getText()) {
              const code = result.getText();
              setUpcValue(code);
              setShowScannerModal(false);
              stopScanner();
              handleLookup(code);
            }
          }
        );
        controlsRef.current = controls;
      } catch (error: unknown) {
        console.error('Scanner error', error);
        const msg = (error instanceof Error && error.name === 'NotAllowedError')
          ? t('inventory.form.cameraDenied', 'Camera permissions denied. Please allow camera access in your browser settings.')
          : t('inventory.form.cameraUnable', 'Unable to start camera. Please allow camera access or try manual entry.');
        setLookupError(msg);
        setScanning(false);
        setShowScannerModal(false);
      }
    };
    runScanner();
    // Cleanup on modal close
    return () => {
      if (!showScannerModal) {
        stopScanner();
      }
    };
  }, [showScannerModal, selectedDeviceId, reader, handleLookup, t]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>{item ? t('inventory.form.headerEdit', 'Edit Item') : t('inventory.form.headerAdd', 'Add New Item')}</h2>
          {item && (
            <button onClick={onCancel} className={styles.closeButton}>
              <X size={20} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="barcode">{t('inventory.form.barcode', 'Barcode / UPC')}</label>
            <div className={styles.scanRow}>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={upcValue}
                onChange={(e) => setUpcValue(e.target.value)}
                placeholder={t('inventory.form.scanOrEnter', 'Scan or enter UPC')}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={scanning ? stopScanner : startScanner}
                className={styles.scanButton}
              >
                {scanning ? <Loader2 size={16} className={styles.spin} /> : <Camera size={16} />}
                {scanning ? t('inventory.form.stop', 'Stop') : t('inventory.form.scan', 'Scan')}
              </button>
              <button
                type="button"
                onClick={() => handleLookup()}
                className={styles.scanButton}
                disabled={lookupLoading}
              >
                {lookupLoading ? <Loader2 size={16} className={styles.spin} /> : <ScanLine size={16} />}
                {t('inventory.form.lookup', 'Lookup')}
              </button>
            </div>
            {/* Modal is used for camera preview */}
            {devices.length > 0 && (
              <div className={styles.deviceRow}>
                <label htmlFor="device">{t('inventory.form.camera', 'Camera')}</label>
                <select id="device" value={selectedDeviceId || ''} onChange={(e) => setSelectedDeviceId(e.target.value || undefined)}>
                  {devices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,6)}`}</option>
                  ))}
                </select>
              </div>
            )}
            <p className={styles.hint}>
              <span className={styles.badge}>{t('inventory.form.hintNew', 'New')}</span> {t('inventory.form.hintScan', 'Use your camera to scan barcodes or enter the UPC manually to autofill fields.')}
            </p>
            {cameraNotice && <p className={styles.hint} style={{ color: '#7c3aed' }}>{cameraNotice}</p>}
            {lookupError && <p className={styles.hint} style={{ color: '#b91c1c' }}>{lookupError}</p>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="name">{t('inventory.form.name', 'Item Name *')}</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t('inventory.form.placeholderName', 'e.g., Tomatoes')}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">{t('inventory.form.category', 'Category *')}</label>
              <input
                type="text"
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                placeholder={t('inventory.form.placeholderCategory', 'e.g., Vegetables')}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quantity">{t('inventory.form.quantity', 'Quantity *')}</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="0"
                step={isDiscreteUnit(formData.unit) ? 1 : 0.01}
                value={formData.quantity}
                onChange={handleChange}
                inputMode={isDiscreteUnit(formData.unit) ? 'numeric' : 'decimal'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="unit">{t('inventory.form.unit', 'Unit *')}</label>
              <select
                id="unit"
                name="unit"
                required
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="kg">{t('inventory.units.kg', 'Kilograms (kg)')}</option>
                <option value="g">{t('inventory.units.g', 'Grams (g)')}</option>
                <option value="liters">{t('inventory.units.liters', 'Liters')}</option>
                <option value="ml">{t('inventory.units.ml', 'Milliliters (ml)')}</option>
                <option value="pieces">{t('inventory.units.pieces', 'Pieces')}</option>
                <option value="boxes">{t('inventory.units.boxes', 'Boxes')}</option>
                <option value="cans">{t('inventory.units.cans', 'Cans')}</option>
                <option value="bottles">{t('inventory.units.bottles', 'Bottles')}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="minStock">{t('inventory.form.minStock', 'Minimum Stock Level *')}</label>
              <input
                type="number"
                id="minStock"
                name="minStock"
                required
                min="0"
                step={isDiscreteUnit(formData.unit) ? 1 : 0.01}
                value={formData.minStock}
                onChange={handleChange}
                inputMode={isDiscreteUnit(formData.unit) ? 'numeric' : 'decimal'}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="price">{t('inventory.form.price', 'Unit Price ($) *')}</label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="supplier">{t('inventory.form.supplier', 'Supplier *')}</label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                required
                value={formData.supplier}
                onChange={handleChange}
                placeholder={t('inventory.form.placeholderSupplier', 'e.g., Fresh Farms Co.')}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            {item && (
              <button
                type="button"
                onClick={onCancel}
                className={styles.cancelButton}
              >
                {t('inventory.form.cancel', 'Cancel')}
              </button>
            )}
            <button type="submit" className={styles.submitButton}>
              {item ? t('inventory.form.update', 'Update Item') : t('inventory.form.add', 'Add Item')}
            </button>
          </div>
        </form>
      </div>

      {!item && (
        <div className={styles.tip}>
          <p>
            <span>{t('inventory.form.tipLabel', 'Tip:')}</span> {t('inventory.form.tipText', 'Set the minimum stock level to get alerts when inventory runs low. This helps you reorder items before they run out.')}
          </p>
        </div>
      )}

      {showScannerModal && typeof window !== 'undefined' && createPortal(
        (
          <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={t('inventory.form.modalScanTitle', 'Scan Barcode')} style={{ zIndex: 9999 }}>
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h3>{t('inventory.form.modalScanTitle', 'Scan Barcode')}</h3>
                <button type="button" className={styles.closeButtonSmall} onClick={() => { setShowScannerModal(false); stopScanner(); }}>{t('inventory.form.close', 'Close')}</button>
              </div>
              <div className={styles.modalBody}>
                <video ref={videoRef} className={styles.modalVideo} muted playsInline autoPlay />
                {devices.length > 0 && (
                  <div className={styles.deviceRow}>
                    <label htmlFor="modal-device">{t('inventory.form.camera', 'Camera')}</label>
                    <select id="modal-device" value={selectedDeviceId || ''} onChange={(e) => setSelectedDeviceId(e.target.value || undefined)}>
                      {devices.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,6)}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {lookupError && <p className={styles.hint} style={{ color: '#b91c1c' }}>{lookupError}</p>}
                {cameraNotice && <p className={styles.hint} style={{ color: '#7c3aed' }}>{cameraNotice}</p>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.closeButtonSmall} onClick={() => { setShowScannerModal(false); stopScanner(); }}>{t('inventory.form.cancel', 'Cancel')}</button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </div>
  );
}
