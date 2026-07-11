import { Permiso } from 'src/app/entities/permiso.enum';

export interface NavItem {
    displayName?: string;
    disabled?: boolean;
    external?: boolean;
    twoLines?: boolean;
    chip?: boolean;
    iconName?: string;
    navCap?: string;
    chipContent?: string;
    chipClass?: string;
    subtext?: string;
    route?: string;
    children?: NavItem[];
    ddType?: string;
    permission?: number | Permiso | string | (number | Permiso | string)[];
}