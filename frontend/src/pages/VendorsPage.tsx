import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Shield, ChevronRight } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { Vendor } from '../types';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New Vendor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    vendor_code: '',
    vendor_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    registration_number: '',
  });

  const navigate = useNavigate();

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vendorsApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setVendors(res.data || []);
      setTotalCount(res.meta?.total || 0);
    } catch (err: any) {
      console.error('Failed to load vendors', err);
      const msg = err.response?.data?.message || err.message || 'Unable to load vendors. Please try again.';
      setError(msg);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vendorsApi.create(form);
      setIsModalOpen(false);
      setForm({
        vendor_code: '',
        vendor_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        registration_number: '',
      });
      fetchVendors();
    } catch (err) {
      console.error('Failed to create vendor', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vendor Directory"
        subtitle="Manage suppliers, performance ratings, and contractual SLAs across the enterprise."
        action={
          <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Vendor</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-vppt-ash/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by vendor name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-vppt-surface border border-vppt-border2 rounded pl-9 pr-3 py-2 text-sm text-vppt-ivory placeholder-vppt-ash/40 focus:outline-none focus:border-vppt-gold transition-colors"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Vendors</option>
              <option value="inactive">Inactive Vendors</option>
              <option value="probation">Probation Vendors</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Vendors Table */}
      <Card ornate>
        {loading ? (
          <LoadingSpinner text="Loading Vendors..." />
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-vppt-crimson/15 border border-vppt-crimson/40 text-vppt-crimson mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-cinzel font-semibold text-vppt-ivory uppercase tracking-wider mb-1">
              Unable to Load Vendors
            </h3>
            <p className="text-xs text-red-300/80 max-w-sm mb-4">{error}</p>
            <Button variant="gold" size="sm" onClick={() => fetchVendors()}>
              Retry
            </Button>
          </div>
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No Vendors Found"
            description="No vendors match your search filters."
            icon={<Shield className="w-8 h-8" />}
            actionLabel="Reset Search"
            onAction={() => {
              setSearch('');
              setStatusFilter('');
            }}
          />
        ) : (
          <>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Vendor Name</TableHeaderCell>
                  <TableHeaderCell>Contact Person</TableHeaderCell>
                  <TableHeaderCell>Contact Information</TableHeaderCell>
                  <TableHeaderCell>Country</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell align="right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow
                    key={v.vendor_id}
                    onClick={() => navigate(`/vendors/${v.vendor_id}`)}
                  >
                    <TableCell>
                      <div className="font-semibold text-vppt-ivory font-cinzel text-sm">{v.vendor_name}</div>
                      <div className="text-[11px] font-mono text-vppt-gold/80">{v.vendor_code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-vppt-ivory">{v.contact_person || '—'}</div>
                      <div className="text-[10px] text-vppt-ash/60">{v.registration_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-vppt-ivory">{v.email || '—'}</div>
                      <div className="text-[10px] text-vppt-ash/60">{v.phone || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-vppt-ash">{v.country || 'Global'}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status || (v.is_active ? 'active' : 'inactive')} />
                    </TableCell>
                    <TableCell align="right">
                      <button className="text-vppt-gold hover:text-vppt-ivory p-1.5 rounded transition-colors inline-flex items-center text-xs">
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="px-5 py-3 border-t border-vppt-border/60 flex items-center justify-between text-xs text-vppt-ash">
              <div>
                Showing {vendors.length} of {totalCount} vendors
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="px-2 font-mono">{page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={vendors.length < 10 || page * 10 >= totalCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Vendor"
        subtitle="Register a new vendor in the system."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreateVendor} isLoading={submitting}>
              Save Vendor
            </Button>
          </>
        }
      >
        <form className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vendor Code"
              placeholder="e.g. VND-009"
              value={form.vendor_code}
              onChange={(e) => setForm({ ...form, vendor_code: e.target.value })}
              required
            />
            <Input
              label="Vendor Name"
              placeholder="e.g. Apex Hardware Supplies"
              value={form.vendor_name}
              onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="Contact Person"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
            <Input
              label="Registration Number"
              placeholder="Registration Number"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="supplier@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+1-555-0199"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Country"
            placeholder="e.g. United States, Germany"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
