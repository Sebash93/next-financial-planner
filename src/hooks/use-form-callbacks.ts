import { useCallback } from "react";
import { useErrorToast } from "./use-error-toast";
import { useDeleteRecordQuery, useMutateRecordQuery } from "@/queries/record.queries";
import { FieldValues, SubmitErrorHandler, useForm } from "react-hook-form";

type useFormCallbacksProps<T> = {
  form: ReturnType<typeof useForm<T extends FieldValues ? T : never>>;
};

export const useFormCallbacks = <T, TDataModel>({ form }: useFormCallbacksProps<T>) => {
  const { errorToast } = useErrorToast();
  const { mutateAsync } = useMutateRecordQuery();
  const { mutateAsync: mutateDeleteAsync } = useDeleteRecordQuery();
  const onSubmit = useCallback(
    async (data: Partial<TDataModel>) => {
      try {
        await mutateAsync(data);
        form.reset();
      } catch (error) {
        errorToast("Error al crear el registro: " + error);
      }
    },
    [mutateAsync, form, errorToast]
  );

  const onSubmitInvalid: SubmitErrorHandler<T extends FieldValues ? T : never> = useCallback(
    (errors) => {
      errorToast(`Review your record: ${JSON.stringify(errors)}`);
    },
    [errorToast]
  );

  const onDelete = useCallback(
    (id: number) => {
      try {
        mutateDeleteAsync(id);
      } catch (error) {
        errorToast("Error al eliminar el registro: " + error);
      }
    },
    [mutateDeleteAsync, errorToast]
  );

  return { onSubmit, onSubmitInvalid, onDelete };
};
