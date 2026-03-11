"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ModalProps = {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

const Modal = ({
  children,
  title,
  description,
  isOpen,
  onClose,
}: ModalProps) => {
  const onChange = (open: boolean) => {
    if (open) {
      onClose();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={() => onChange(isOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
