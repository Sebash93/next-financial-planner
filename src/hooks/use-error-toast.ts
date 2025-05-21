import { useToast } from "./use-toast";

const useErrorToast = () => {
  const { toast } = useToast();
  const errorToast = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };
  return { errorToast };
};

export { useErrorToast };
