'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FC } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Drawer: FC<DrawerProps> = ({ isOpen, onClose, children }) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-md bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Giỏ hàng</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}; 