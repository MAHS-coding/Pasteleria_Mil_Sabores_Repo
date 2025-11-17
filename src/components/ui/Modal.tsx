import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

type Props = {
    show: boolean;
    title?: React.ReactNode;
    children?: React.ReactNode;
    onClose?: () => void;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    className?: string;
    hideFooter?: boolean;
    contentClassName?: string;
    contentStyle?: React.CSSProperties;
    id?: string;
    labelledBy?: string;
};

const Modal: React.FC<Props> = ({ show, title, children, onClose, onConfirm, confirmLabel = "Confirmar", cancelLabel = "Cancelar", className, hideFooter = false, contentClassName, contentStyle, id, labelledBy }) => {
    useEffect(() => {
        if (!show) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose && onClose();
        };
        // prevent page scroll when modal open
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("keydown", handler);
            document.body.style.overflow = prevOverflow;
        };
    }, [show, onClose]);

    if (!show) return null;

    const node = (
        <>
            <div id={id} className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ background: "rgba(0,0,0,0.4)" }}>
                <div className={`modal-dialog modal-dialog-centered ${className || ""}`} role="document">
                    <div className={`modal-content ${contentClassName || ""}`} style={contentStyle}>
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">{children}</div>
                        {!hideFooter && (
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>{cancelLabel}</button>
                                {onConfirm && (
                                    <button type="button" className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );

    return typeof document !== 'undefined' && document.body ? createPortal(node, document.body) : node;
};

export default Modal;
