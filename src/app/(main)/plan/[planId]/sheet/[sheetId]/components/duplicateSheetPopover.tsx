"use client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react"
import { useState } from "react";
import { Plan } from "@prisma/client";

type DuplicateSheetPopoverProps = {
    availablePlans: Plan[];
    onDuplicate: (destinationPlanId: string) => Promise<void>;
    disabled?: boolean;
}

export const DuplicateSheetPopover = ({
    availablePlans,
    onDuplicate,
    disabled = false
}: DuplicateSheetPopoverProps) => {
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleDuplicate = async () => {
        if (!selectedPlanId) return;

        await onDuplicate(selectedPlanId);
        setIsPopoverOpen(false);
        setSelectedPlanId("");
    }

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <Copy className="h-4 w-4" />
                    Duplicar Hoja
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Duplicar Hoja</h4>
                        <p className="text-sm text-muted-foreground">
                            Selecciona el plan destino donde duplicar esta hoja
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Plan Destino</label>
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePlans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id.toString()}>
                                        {plan.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsPopoverOpen(false)}>
                            Cancelar
                        </Button>
                        <Button size="sm" onClick={handleDuplicate} disabled={!selectedPlanId}>
                            Duplicar
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
