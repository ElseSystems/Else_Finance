import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building2, Save } from 'lucide-react';

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      fetchTenant();
    }
  }, [profile]);

  const fetchTenant = async () => {
    if (!profile?.tenant_id) return;
    
    const { data } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', profile.tenant_id)
      .single();
    
    if (data) {
      setTenantName(data.name);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('user_id', profile.user_id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Perfil atualizado!' });
    }
    
    setLoading(false);
  };

  const handleSaveTenant = async () => {
    if (!profile?.tenant_id) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('tenants')
      .update({ name: tenantName })
      .eq('id', profile.tenant_id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Empresa atualizada!' });
    }
    
    setLoading(false);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu perfil e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Perfil</h3>
              <p className="text-sm text-muted-foreground">Suas informações pessoais</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado
              </p>
            </div>

            <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
              <Save size={18} />
              Salvar Perfil
            </Button>
          </div>
        </div>

        {/* Company Settings */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Building2 className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Empresa</h3>
              <p className="text-sm text-muted-foreground">Configurações da empresa</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>

            <div className="space-y-2">
              <Label>ID do Tenant</Label>
              <Input
                value={profile?.tenant_id || ''}
                disabled
                className="bg-muted font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Identificador único da sua conta
              </p>
            </div>

            <Button onClick={handleSaveTenant} disabled={loading} className="gap-2">
              <Save size={18} />
              Salvar Empresa
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
