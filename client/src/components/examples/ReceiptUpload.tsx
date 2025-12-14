import { ReceiptUpload } from "../ReceiptUpload";

export default function ReceiptUploadExample() {
  return (
    <ReceiptUpload
      onExtracted={(data) => console.log("Receipt data extracted:", data)}
    />
  );
}
