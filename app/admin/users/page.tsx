import { createClient } from '@/utils/supabase-server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChangeRoleSelect } from '@/components/admin/ChangeRoleSelect';
import { deleteUserProfile } from '@/app/actions';
import { Trash2 } from 'lucide-react';

export const instant = false;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="text-destructive">Ошибка: {error.message}</div>;
  }

  const users = data ?? [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Пользователи ({users.length})
      </h2>

      {users.length === 0 ? (
        <p className="text-muted-foreground">Пользователей нет.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <Card key={u.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {u.full_name || 'Без имени'}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (вы)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {u.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Регистрация: {formatDate(u.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                      {u.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </Badge>

                    <ChangeRoleSelect
                      userId={u.id}
                      currentRole={u.role}
                      isSelf={isSelf}
                    />

                    {!isSelf && (
                      <form action={deleteUserProfile}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Удалить пользователя"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}