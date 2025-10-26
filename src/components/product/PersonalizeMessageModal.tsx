import React from "react";
import Modal from "../ui/Modal";

type Props = {
  show: boolean;
  productName?: string;
  title?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
  helpText?: React.ReactNode;
  maxLength?: number;
  inputId?: string;
};

const PersonalizeMessageModal: React.FC<Props> = ({
  show,
  productName,
  title = <>Mensaje personalizado <small className="text-secondary">(opcional)</small></>,
  value,
  onChange,
  onConfirm,
  onCancel,
  confirmLabel = "Agregar al carrito",
  cancelLabel = "Cancelar",
  placeholder = "Ej: ¡Feliz Cumpleaños, Ana! (opcional)",
  helpText = <div className="form-text mt-2">Puedes dejar este campo vacío si no deseas agregar un mensaje.</div>,
  maxLength = 60,
  inputId = "personalize-message-input",
}) => {
  return (
    <Modal
      show={show}
      title={title}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
    >
      {productName && <p className="mb-2"><strong>{productName}</strong></p>}
      <input
        id={inputId}
        autoFocus
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-control"
        placeholder={placeholder}
      />
      {helpText}
    </Modal>
  );
};

export default PersonalizeMessageModal;
