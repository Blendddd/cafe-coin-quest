import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
}

const MenuModal = ({ open, onClose }: MenuModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-center">
            La Nova Cafe - Menu
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <iframe
            src="https://lanova-restcafe.com/index-kurdish.html"
            className="w-full h-[800px] border-0"
            title="La Nova Cafe Menu"
            loading="lazy"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuModal;