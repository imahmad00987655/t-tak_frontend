import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Building2, CreditCard, Shield, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchManagedUsers,
  fetchSettings,
  updateManagedUserPassword,
  updateManagedUserStatus,
  updateBillingSettings,
  updateBusinessSettings,
  updateNotificationSettings,
  updatePromotionSettings,
  type SettingsPayload,
} from '@/lib/settingsApi';

function SettingCard({ icon: Icon, title, description, children }: { icon: any; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

const defaultState: SettingsPayload = {
  business: {
    businessName: '',
    contactPhone: '',
    emailAddress: '',
    city: '',
    fullAddress: '',
  },
  billing: {
    allowCredit: false,
    autoInvoice: false,
    clientReportMode: 'daily',
    defaultPaymentMethod: 'cash',
  },
  promotions: {
    buyXGetYEnabled: false,
    buyXQty: 0,
    buyYQty: 0,
    spendXGetYEnabled: false,
    spendAmount: 0,
    spendFreeQty: 0,
  },
  notifications: {
    lowStockAlert: false,
    emailNotify: false,
    failedDeliveryAlert: false,
    paymentReceivedAlert: false,
  },
  roles: [],
};

export default function SettingsPage() {
  const roleLabelMap: Record<string, string> = {
    admin: 'Admin',
    staff: 'Plant Staff',
    field_worker: 'Field Worker',
    client: 'Customer',
  };
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });
  const { data: managedUsers = [] } = useQuery({
    queryKey: ['settings-users'],
    queryFn: fetchManagedUsers,
  });

  const [local, setLocal] = useState<SettingsPayload>(defaultState);

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const saveBusiness = useMutation({
    mutationFn: updateBusinessSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
  const saveBilling = useMutation({
    mutationFn: updateBillingSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
  const saveNotifications = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
  const savePromotions = useMutation({
    mutationFn: updatePromotionSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
  const setUserStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) =>
      updateManagedUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
  const setUserPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      updateManagedUserPassword(userId, password),
    onSuccess: () => toast.success('Password updated'),
    onError: (e: Error) => toast.error(e.message || 'Could not update password'),
  });

  const saving = saveBusiness.isPending || saveBilling.isPending || saveNotifications.isPending || savePromotions.isPending;

  const onSaveAll = async () => {
    try {
      await Promise.all([
        saveBusiness.mutateAsync(local.business),
        saveBilling.mutateAsync(local.billing),
        savePromotions.mutateAsync(local.promotions),
        saveNotifications.mutateAsync(local.notifications),
      ]);
      toast.success('Settings saved successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    }
  };

  if (isError) {
    return (
      <div>
        <PageHeader title="Settings" description="System configuration and preferences" />
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load settings</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="System configuration and preferences"
        actions={
          <Button onClick={onSaveAll} disabled={isLoading || saving} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm px-4">
            <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        }
      />

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs">Promotions & Packages</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs">Roles & Access</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-5">
          <SettingCard icon={Building2} title="Business Information" description="Your company details used across the platform">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Business Name</Label>
                <Input value={local.business.businessName} onChange={(e) => setLocal((p) => ({ ...p, business: { ...p.business, businessName: e.target.value } }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Contact Phone</Label>
                <Input value={local.business.contactPhone} onChange={(e) => setLocal((p) => ({ ...p, business: { ...p.business, contactPhone: e.target.value } }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <Input value={local.business.emailAddress} type="email" onChange={(e) => setLocal((p) => ({ ...p, business: { ...p.business, emailAddress: e.target.value } }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">City</Label>
                <Input value={local.business.city} onChange={(e) => setLocal((p) => ({ ...p, business: { ...p.business, city: e.target.value } }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Full Address</Label>
              <Input value={local.business.fullAddress} onChange={(e) => setLocal((p) => ({ ...p, business: { ...p.business, fullAddress: e.target.value } }))} />
            </div>
            <div className="pt-2">
              <Button type="button" size="sm" onClick={() => saveBusiness.mutate(local.business)} disabled={saveBusiness.isPending}>
                {saveBusiness.isPending ? 'Saving...' : 'Save Business'}
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="billing" className="space-y-5">
          <SettingCard icon={CreditCard} title="Billing Configuration" description="Control how billing and payments work">
            <SettingRow label="Allow Credit" description="Allow deliveries even when wallet balance is insufficient">
              <Switch checked={local.billing.allowCredit} onCheckedChange={(v) => setLocal((p) => ({ ...p, billing: { ...p.billing, allowCredit: v } }))} />
            </SettingRow>
            <SettingRow label="Auto-Generate Invoices" description="Automatically create invoices when deliveries are completed">
              <Switch checked={local.billing.autoInvoice} onCheckedChange={(v) => setLocal((p) => ({ ...p, billing: { ...p.billing, autoInvoice: v } }))} />
            </SettingRow>
            <SettingRow label="Client Report Mode" description="How clients view their delivery reports">
              <Select value={local.billing.clientReportMode} onValueChange={(v) => setLocal((p) => ({ ...p, billing: { ...p.billing, clientReportMode: v as any } }))}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Default Payment Method" description="Pre-selected payment method in forms">
              <Select value={local.billing.defaultPaymentMethod} onValueChange={(v) => setLocal((p) => ({ ...p, billing: { ...p.billing, defaultPaymentMethod: v as any } }))}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <div className="pt-2">
              <Button type="button" size="sm" onClick={() => saveBilling.mutate(local.billing)} disabled={saveBilling.isPending}>
                {saveBilling.isPending ? 'Saving...' : 'Save Billing'}
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-5">
          <SettingCard icon={CreditCard} title="Promotions & Packages" description="Configure product-type based offers used in billing and invoices">
            <SettingRow label="Buy X units, get Y free" description="Enable quantity based package offer for selected product types">
              <Switch
                checked={local.promotions.buyXGetYEnabled}
                onCheckedChange={(v) => setLocal((p) => ({ ...p, promotions: { ...p.promotions, buyXGetYEnabled: v } }))}
              />
            </SettingRow>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Buy Quantity (X)</Label>
                <Input
                  type="number"
                  min={0}
                  value={local.promotions.buyXQty}
                  onChange={(e) => setLocal((p) => ({ ...p, promotions: { ...p.promotions, buyXQty: Number(e.target.value || 0) } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Free Quantity (Y)</Label>
                <Input
                  type="number"
                  min={0}
                  value={local.promotions.buyYQty}
                  onChange={(e) => setLocal((p) => ({ ...p, promotions: { ...p.promotions, buyYQty: Number(e.target.value || 0) } }))}
                />
              </div>
            </div>

            <SettingRow label="Spend X amount, get Y bottles free" description="Enable amount based promotion">
              <Switch
                checked={local.promotions.spendXGetYEnabled}
                onCheckedChange={(v) => setLocal((p) => ({ ...p, promotions: { ...p.promotions, spendXGetYEnabled: v } }))}
              />
            </SettingRow>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Spend Amount (X)</Label>
                <Input
                  type="number"
                  min={0}
                  value={local.promotions.spendAmount}
                  onChange={(e) => setLocal((p) => ({ ...p, promotions: { ...p.promotions, spendAmount: Number(e.target.value || 0) } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Free Bottles (Y)</Label>
                <Input
                  type="number"
                  min={0}
                  value={local.promotions.spendFreeQty}
                  onChange={(e) => setLocal((p) => ({ ...p, promotions: { ...p.promotions, spendFreeQty: Number(e.target.value || 0) } }))}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button type="button" size="sm" onClick={() => savePromotions.mutate(local.promotions)} disabled={savePromotions.isPending}>
                {savePromotions.isPending ? 'Saving...' : 'Save Promotions'}
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-5">
          <SettingCard icon={Bell} title="Notification Preferences" description="Configure alerts and notifications">
            <SettingRow label="Low Stock Alerts" description="Get notified when inventory drops below minimum levels">
              <Switch checked={local.notifications.lowStockAlert} onCheckedChange={(v) => setLocal((p) => ({ ...p, notifications: { ...p.notifications, lowStockAlert: v } }))} />
            </SettingRow>
            <SettingRow label="Email Notifications" description="Receive daily summary reports via email">
              <Switch checked={local.notifications.emailNotify} onCheckedChange={(v) => setLocal((p) => ({ ...p, notifications: { ...p.notifications, emailNotify: v } }))} />
            </SettingRow>
            <SettingRow label="Failed Delivery Alerts" description="Notify admin when a delivery fails or is cancelled">
              <Switch checked={local.notifications.failedDeliveryAlert} onCheckedChange={(v) => setLocal((p) => ({ ...p, notifications: { ...p.notifications, failedDeliveryAlert: v } }))} />
            </SettingRow>
            <SettingRow label="Payment Received Alerts" description="Alert when a payment is recorded">
              <Switch checked={local.notifications.paymentReceivedAlert} onCheckedChange={(v) => setLocal((p) => ({ ...p, notifications: { ...p.notifications, paymentReceivedAlert: v } }))} />
            </SettingRow>
            <div className="pt-2">
              <Button type="button" size="sm" onClick={() => saveNotifications.mutate(local.notifications)} disabled={saveNotifications.isPending}>
                {saveNotifications.isPending ? 'Saving...' : 'Save Notifications'}
              </Button>
            </div>
          </SettingCard>
        </TabsContent>

        <TabsContent value="roles" className="space-y-5">
          <SettingCard icon={Shield} title="Roles & Permissions" description="Manage user roles and access levels">
            <div className="space-y-3">
              {(local.roles || []).map((r) => (
                <div key={r.role} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.permissions.join(', ')}</p>
                  </div>
                  <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{r.users} users</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User Access Control</p>
              {managedUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-md border border-border">
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.phone} · {roleLabelMap[u.role] || u.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="New password"
                      className="h-8 w-[150px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (!value) return;
                          setUserPassword.mutate({ userId: u.id, password: value });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant={u.status === 'active' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() =>
                        setUserStatus.mutate({
                          userId: u.id,
                          status: u.status === 'active' ? 'inactive' : 'active',
                        })
                      }
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SettingCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
