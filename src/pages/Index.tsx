
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";
import { ImageCropper } from "@/components/ImageCropper";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      setCropperOpen(true);
    }
  };

  const handleCropSuccess = ({ base64, file }: { base64: string; file: File }) => {
    setPreviewImage(base64);
    setSelectedFile(file);
    toast({
      title: "Image cropped successfully",
      description: "Your profile image has been updated",
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Quick Crop Image Tool
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Easily upload, crop, and adjust your profile picture with our interactive tool. 
          Similar to LinkedIn's profile image editor.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Image</CardTitle>
            <CardDescription>
              Select an image to crop and customize
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-8 group">
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-primary transition-colors" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>

            <Button 
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="w-full"
            >
              Select Image
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Your cropped profile image
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center">
              {previewImage ? (
                <div className="relative">
                  <img 
                    src={previewImage} 
                    alt="Cropped preview" 
                    className="w-48 h-48 rounded-full object-cover border-4 border-purple-100 shadow-md"
                  />
                  <Button 
                    size="sm" 
                    className="absolute bottom-2 right-2"
                    onClick={() => setCropperOpen(true)}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              ) : (
                <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {previewImage && (
              <div className="w-full flex justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (previewImage) {
                      const link = document.createElement('a');
                      link.href = previewImage;
                      link.download = 'cropped-profile-image.jpg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  Download Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        file={selectedFile}
        onSuccess={handleCropSuccess}
        aspectRatio={1}
        cropShape="round"
      />
    </div>
  );
};

export default Index;
