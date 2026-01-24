import { toast } from "sonner";

const useErrorToast = () => {
  const errorToast = (message: string) => {
    toast.error("Error", { description: message });
  };
  return { errorToast };
};

export { useErrorToast };
