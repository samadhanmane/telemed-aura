import { useState } from "react";
import { Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadUploadFile } from "@/lib/download-file";
import { toast } from "sonner";

type Props = {
  fileUrl?: string;
  fileName?: string;
  label?: string;
} & Pick<ButtonProps, "variant" | "size" | "className">;

export function DownloadFileButton({
  fileUrl,
  fileName,
  label = "Download",
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  const onDownload = async () => {
    if (!fileUrl) return;
    setLoading(true);
    try {
      await downloadUploadFile(fileUrl, fileName);
      toast.success("Download started");
    } catch {
      toast.error("Could not download file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={!fileUrl || loading}
      onClick={onDownload}
    >
      <Download className="mr-1 h-3 w-3" />
      {loading ? "Downloading…" : label}
    </Button>
  );
}
