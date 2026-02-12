'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Shield, Plus, Edit2, Lock, Unlock, Search, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { adminsService, AdminUser } from '@/lib/services/admins.service';

export default function AdminsPage() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'ADMIN',
        permissions: [] as string[],
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            const res = await adminsService.getAdmins();
            setAdmins(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'ADMIN',
            permissions: [],
            isActive: true
        });
        setModalType('create');
    };

    const openEditModal = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setFormData({
            username: admin.username,
            email: admin.email,
            password: '', // Password not editable directly here usually, but maybe for reset
            role: admin.role,
            permissions: admin.permissions || [],
            isActive: admin.isActive
        });
        setModalType('edit');
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (modalType === 'create') {
                if (!formData.username || !formData.email || !formData.password) {
                    alert('Please fill all required fields');
                    setSaving(false);
                    return;
                }
                await adminsService.createAdmin(formData);
            } else if (modalType === 'edit' && selectedAdmin) {
                await adminsService.updateAdmin(selectedAdmin._id, {
                    role: formData.role,
                    isActive: formData.isActive
                    // permissions if implemented
                });
            }
            setModalType(null);
            loadAdmins();
        } catch (err: any) {
            alert(err.response?.data?.error || err.message || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (role: string) => {
        return <Badge variant={role === 'SUPER_ADMIN' ? 'danger' : 'success'}>{role}</Badge>;
    };

    return (
        <AdminLayout>
            <PageHeader
                title="Admin Management"
                description="Manage system administrators and their roles."
                breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Admins' }]}
            />

            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-end">
                    <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" /> Create New Admin
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Admin User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins.map((admin) => (
                                        <TableRow key={admin._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{admin.username}</p>
                                                        <p className="text-xs text-gray-500">{admin.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(admin.role)}</TableCell>
                                            <TableCell>
                                                <Badge variant={admin.isActive ? 'success' : 'default'}>
                                                    {admin.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatDateTime(admin.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(admin)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {admins.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No administrators found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden p-4 space-y-4">
                            {admins.map((admin) => (
                                <div key={admin._id} className="border rounded-lg p-4 bg-gray-50/50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold">{admin.username}</p>
                                                <p className="text-xs text-gray-500">{admin.email}</p>
                                            </div>
                                        </div>
                                        {getRoleBadge(admin.role)}
                                    </div>

                                    <div className="flex justify-between items-center text-sm mb-3">
                                        <span className="text-gray-500">Status</span>
                                        <Badge variant={admin.isActive ? 'success' : 'default'}>
                                            {admin.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="pt-2 border-t flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditModal(admin)}
                                            className="w-full"
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Permissions
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={!!modalType}
                onClose={() => setModalType(null)}
                title={modalType === 'create' ? 'Create New Admin' : 'Edit Admin'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            className="w-full border rounded p-2"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            disabled={modalType === 'edit'} // Username typically immutable or specialized logic
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            className="w-full border rounded p-2"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            disabled={modalType === 'edit'} // Email typically immutable or specialized logic
                        />
                    </div>
                    {modalType === 'create' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full border rounded p-2"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">Active Account</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModalType(null)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
