import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Building2, Key, User, Lock } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    garageName: 'AutoGarage',
    phone: '+91 98765 43210',
    email: 'contact@autogarage.com',
    address: 'Shop No. 15, Industrial Area, Pune',
    adminUsername: 'admin',
    adminPassword: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: api.whatsapp.templates,
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ stage, message, isActive }: { stage: string; message: string; isActive: boolean }) =>
      api.whatsapp.updateTemplate(stage, message, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({ title: 'Template updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update template', variant: 'destructive' });
    }
  });

  const updateAdminMutation = useMutation({
    mutationFn: (data: { username: string; password?: string }) => api.settings.updateAdmin(data),
    onSuccess: () => {
      toast({ title: 'Admin credentials updated successfully' });
      setSettings(prev => ({ ...prev, adminPassword: '' }));
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update admin credentials', description: error.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    updateAdminMutation.mutate({
      username: settings.adminUsername,
      password: settings.adminPassword || undefined
    });
  };

  const handleTemplateUpdate = (stage: string, message: string, isActive: boolean) => {
    updateTemplateMutation.mutate({ stage, message, isActive });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your garage information and WhatsApp integration</p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-foreground font-medium flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Garage Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="garageName">Garage Name</Label>
              <Input 
                id="garageName"
                value={settings.garageName}
                onChange={(e) => setSettings({...settings, garageName: e.target.value})}
                className="bg-background border-border"
                data-testid="input-garage-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                className="bg-background border-border"
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                className="bg-background border-border"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="bg-background border-border"
                data-testid="input-address"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-foreground font-medium flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Admin Credentials
            </CardTitle>
            <CardDescription>
              Update your admin login credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminUsername">Admin Name</Label>
              <Input 
                id="adminUsername"
                value={settings.adminUsername}
                onChange={(e) => setSettings({...settings, adminUsername: e.target.value})}
                className="bg-background border-border"
                data-testid="input-admin-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">New Password</Label>
              <Input 
                id="adminPassword"
                type="password"
                value={settings.adminPassword}
                onChange={(e) => setSettings({...settings, adminPassword: e.target.value})}
                className="bg-background border-border"
                placeholder="Enter new password to change"
                data-testid="input-admin-password"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-foreground font-medium flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              WhatsApp Business API Setup
            </CardTitle>
            <CardDescription>
              Configure your WhatsApp Business Cloud API to send automatic status updates to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappPhoneNumberId">WhatsApp Phone Number ID</Label>
              <Input 
                id="whatsappPhoneNumberId"
                value={settings.whatsappPhoneNumberId}
                onChange={(e) => setSettings({...settings, whatsappPhoneNumberId: e.target.value})}
                className="bg-background border-border"
                placeholder="Your WhatsApp Business phone number ID"
                data-testid="input-whatsapp-phone-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappAccessToken">WhatsApp Access Token</Label>
              <Input 
                id="whatsappAccessToken"
                type="password"
                value={settings.whatsappAccessToken}
                onChange={(e) => setSettings({...settings, whatsappAccessToken: e.target.value})}
                className="bg-background border-border"
                placeholder="Your permanent access token"
                data-testid="input-whatsapp-token"
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300">How to get your credentials:</p>
                  <ol className="mt-2 space-y-1 text-blue-700 dark:text-blue-400 list-decimal list-inside">
                    <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Meta Developer Console</a> and create an app</li>
                    <li>Add WhatsApp Business product to your app</li>
                    <li>Go to WhatsApp &gt; API Setup to find your Phone Number ID</li>
                    <li>Generate a permanent access token from System Users</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="text-foreground font-medium">Job Stage Templates</CardTitle>
            <CardDescription>
              Templates for job stage notifications (for service jobs workflow)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Loading templates...</p>
            ) : (
              templates.map((template: any) => (
                <div key={template.stage} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.stage}</Badge>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={(checked) => handleTemplateUpdate(template.stage, template.message, checked)}
                    />
                  </div>
                  <Textarea
                    value={template.message}
                    onChange={(e) => {
                      const newTemplates = templates.map((t: any) =>
                        t.stage === template.stage ? { ...t, message: e.target.value } : t
                      );
                      queryClient.setQueryData(['whatsapp-templates'], newTemplates);
                    }}
                    onBlur={() => handleTemplateUpdate(template.stage, template.message, template.isActive)}
                    className="text-sm"
                    rows={2}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" data-testid="button-save-settings">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
