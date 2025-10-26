import React, { useCallback, useState } from "react";
import Modal from "../components/ui/Modal";

export type ShowInfo = (title: string, message: string) => void;

export function useInfoModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string>("Aviso");
  const [message, setMessage] = useState<string>("");

  const showInfo = useCallback<ShowInfo>((t, m) => {
    setTitle(t);
    setMessage(m);
    setOpen(true);
  }, []);

  const InfoModal: React.FC = useCallback(() => (
    <Modal
      show={open}
      title={title}
      onClose={() => setOpen(false)}
      onConfirm={() => setOpen(false)}
      confirmLabel="Cerrar"
    >
      <div>{message}</div>
    </Modal>
  ), [open, title, message]);

  return { InfoModal, showInfo } as const;
}

export default useInfoModal;
