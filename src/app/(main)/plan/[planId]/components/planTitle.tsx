"use client"
import { PageTitle } from "@/components/custom/page-title";
import { useOnePlanQuery, useUpdatePlanQuery } from "@/queries/plan.queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";
import { useErrorToast } from "@/hooks/use-error-toast";

type PlanTitleProps = {
    planId: string;
}

export const PlanTitle = ({ planId }: PlanTitleProps) => {
    const { data: plan, isLoading } = useOnePlanQuery(planId);
    const { mutateAsync: updatePlan } = useUpdatePlanQuery();
    const { errorToast } = useErrorToast();

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState("");

    const handleStartEdit = () => {
        if (plan) {
            setEditedName(plan.name);
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedName("");
    };

    const handleSave = async () => {
        if (!editedName.trim()) {
            errorToast("El nombre del plan no puede estar vacío");
            return;
        }

        try {
            await updatePlan({
                planId,
                data: { name: editedName.trim() }
            });
            setIsEditing(false);
            setEditedName("");
        } catch {
            errorToast("No se pudo actualizar el nombre del plan");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (isLoading) {
        return <div className="animate-pulse bg-gray-200 h-8 rounded-md w-1/2" />;
    }

    if (plan) {
        return (
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="text-3xl font-bold h-12"
                            autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleSave}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <PageTitle>{plan.name}</PageTitle>
                        <Button size="icon" variant="ghost" onClick={handleStartEdit}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
        );
    }
}