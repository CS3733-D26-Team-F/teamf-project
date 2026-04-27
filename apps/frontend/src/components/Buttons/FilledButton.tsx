import { Button } from "@mantine/core";
import type { ButtonProps } from "@mantine/core";
import type { ReactNode } from "react";
import { IconPlus } from "@tabler/icons-react";

interface FilledButtonProps extends ButtonProps {
    leftSection?: ReactNode | "plus";
    onClick?: () => void;
    children: ReactNode;
}

export function FilledButton({ leftSection, onClick, children, ...props }: FilledButtonProps) {

    const resolved = leftSection === "plus" 
        ? <IconPlus size={16} />
        : leftSection;

    return (
        <Button leftSection={resolved} onClick={onClick} className="invert-hover" {...props}>
            {children}
        </Button>
    );
}
