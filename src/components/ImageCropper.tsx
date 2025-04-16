
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

  const getCroppedImg = async () => {
    try {
      if (!src || !croppedAreaPixels || !file) return;

      const image = await createImage(src);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      // Set canvas size to the cropped size
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the rotated and cropped image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Create circular mask if cropShape is round
      if (cropShape === "round") {
        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          Math.min(canvas.width, canvas.height) / 2,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }

      const base64Image = canvas.toDataURL("image/jpeg");

      // Convert base64 to Blob and create a File
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      // Determine the original file type
      const fileType = file.type || "image/jpeg"; // Default to jpeg if type is unknown
      const croppedFile = new File([blob], "cropped-" + file.name, { type: fileType });

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
