import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user?: User | null; showEmail?: boolean }) {
    const getInitials = useInitials();

    if (!user) {
        return (
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-neutral-600">Tamu</span>
            </div>
        );
    }

    return (
        <>
            <div className="relative shrink-0">
                <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                {(user as any)?.is_pro && (
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-[1px] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[7.5px] font-black tracking-wider uppercase border border-white shadow-xs leading-none">
                        PRO
                    </span>
                )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{user.name}</span>
                    {(user as any)?.is_pro && (
                        <span className="text-[8px] font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-2xs">
                            PRO
                        </span>
                    )}
                </div>
                {showEmail && <span className="text-muted-foreground truncate text-xs">{user.email}</span>}
            </div>
        </>
    );
}
