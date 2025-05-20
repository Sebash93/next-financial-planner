import { ReactNode } from "react";
import { FolderOpen } from "lucide-react";

export default function AlertEmpty({ children, title }: { children: ReactNode, title: string }) {
    return <div className="flex flex-col items-center justify-center w-full">
        <div className="flex justify-center items-center w-16 h-16 bg-gray-100 rounded-full">
            <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            {title}
        </h3>
        <div className="leading-7">
            {children}
        </div>
    </div>
}