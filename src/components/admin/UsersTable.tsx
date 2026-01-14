import { Loader2 } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  tenant_name: string | null;
  role: string;
}

interface UsersTableProps {
  users: UserWithRole[];
  loading: boolean;
}

export function UsersTable({ users, loading }: UsersTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">E-mail</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Empresa</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Função</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-3 px-4 font-medium text-foreground">
                {user.full_name || 'Sem nome'}
              </td>
              <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
              <td className="py-3 px-4 text-muted-foreground">
                {user.tenant_name || '-'}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {user.role}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
