
import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCcw, RotateCw, Check, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (value: { base64: string; file: File }) => void;
  file: File | null;
  aspectRatio?: number;
  cropShape?: "rect" | "round";
  maxZoom?: number;
}

export const ImageCropper = ({
  open,
  onOpenChange,
  onSuccess,
  file,
  aspectRatio = 1,
  cropShape = "round",
  maxZoom = 10,
}: ImageCropperProps) => {
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  const onCropComplete = useCallback(
    (_croppedArea: any, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  // Completely rewritten image cropping function to correctly handle rotation
  const getCroppedImg = async () => {
    try {
      if (!src || !croppedAreaPixels || !file) return;

      // Create an image element from the source
      const image = await createImage(src);
      
      // Create a canvas that's large enough for any rotation
      const canvas = document.createElement("canvas");
      // Use a larger size to accommodate rotation
      const maxSize = Math.max(image.width, image.height) * 2;
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("No 2d context");
      }

      // Move to center, rotate, and draw
      ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate the center position for the image
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Translate to center, rotate, then translate back
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-image.width / 2, -image.height / 2);
      
      // Draw the image at the calculated position
      ctx.drawImage(image, 0, 0);
      ctx.restore();
      
      // Now create a second canvas for the final cropped image
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = croppedAreaPixels.width;
      croppedCanvas.height = croppedAreaPixels.height;
      const croppedCtx = croppedCanvas.getContext("2d");
      
      if (!croppedCtx) {
        throw new Error("No 2d context for cropped canvas");
      }
      
      // Calculate where the crop area is located in the rotated image
      const cropX = centerX - image.width / 2 + croppedAreaPixels.x;
      const cropY = centerY - image.height / 2 + croppedAreaPixels.y;
      
      // Draw only the cropped portion onto the second canvas
      croppedCtx.drawImage(
        canvas,
        cropX,
        cropY,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      
      // If cropShape is round, apply a circular mask
      if (cropShape === "round") {
        croppedCtx.globalCompositeOperation = "destination-in";
        croppedCtx.beginPath();
        croppedCtx.arc(
          croppedCanvas.width / 2,
          croppedCanvas.height / 2,
          Math.min(croppedCanvas.width, croppedCanvas.height) / 2,
          0,
          2 * Math.PI
        );
        croppedCtx.fill();
      }
      
      // Convert to base64
      const base64Image = croppedCanvas.toDataURL(file.type || "image/jpeg");
      
      // Convert base64 to File
      const res = await fetch(base64Image);
      const blob = await res.blob();
      const fileName = file.name ? `cropped-${file.name}` : "cropped-image.jpg";
      const croppedFile = new File([blob], fileName, { type: file.type || "image/jpeg" });

      onSuccess({ base64: base64Image, file: croppedFile });
      onOpenChange(false);
      return { base64: base64Image, file: croppedFile };
    } catch (e) {
      console.error("Error cropping image:", e);
    }
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Crop Image</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 relative">
            <div className="relative w-full h-[300px] md:h-[400px] mx-auto overflow-hidden bg-muted rounded-lg">
              {src && (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape={cropShape}
                  showGrid={false}
                  objectFit="contain"
                  classes={{
                    containerClassName: "reactEasyCrop_Container",
                    cropAreaClassName: "reactEasyCrop_CropArea",
                  }}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full md:w-64 space-y-6 pt-4 md:pt-8">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Zoom</label>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="text-gray-500 hover:text-primary"
                    type="button"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setZoom(Math.min(maxZoom, zoom + 0.1))}
                    className="text-gray-500 hover:text-primary"
                    type="button"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={maxZoom}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Rotate</label>
              <div className="flex gap-2">
                <Button
                  onClick={handleRotateLeft}
                  variant="outline"
                  className="p-2 flex-1"
                  type="button"
                >
                  <RotateCcw className="w-5 h-5 mx-auto" />
                </Button>
                <Button
                  onClick={handleRotateRight}
                  variant="outline"
                  className="p-2 flex-1"
                  type="button"
                >
                  <RotateCw className="w-5 h-5 mx-auto" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button onClick={getCroppedImg} className="w-full flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
