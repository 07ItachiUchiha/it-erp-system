import React, { useState, useEffect, ChangeEvent } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Plus, Download, Eye, Edit, Trash2, FileText, DollarSign, Calendar, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { billService, type Bill, type BillItem, type BillPayment, type BillSummary } from '../../services/billService';

// UI Components - Replace with your actual UI library imports
const Card = ({ children, className = "" }: any) => <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
const CardContent = ({ children, className = "" }: any) => <div className={`p-6 ${className}`}>{children}</div>;
const CardHeader = ({ children, className = "" }: any) => <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
const Button = ({ children, className = "", variant = "default", size = "default", onClick, disabled, type = "button" }: any) => 
  <button 
    type={type}
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 rounded font-medium ${
      variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' :
      variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-2 py-1 text-sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>;

const Table = ({ children, className = "" }: any) => <table className={`min-w-full divide-y divide-gray-200 ${className}`}>{children}</table>;
const TableHeader = ({ children }: any) => <thead className="bg-gray-50">{children}</thead>;
const TableBody = ({ children }: any) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
const TableRow = ({ children }: any) => <tr>{children}</tr>;
const TableHead = ({ children, className = "" }: any) => <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>;
const TableCell = ({ children, className = "" }: any) => <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>;

const Badge = ({ children, className = "" }: any) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;

const Input = ({ className = "", ...props }: any) => 
  <input className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`} {...props} />;

const Select = ({ children, value, onValueChange }: any) => 
  <select value={value} onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
    {children}
  </select>;
const SelectTrigger = ({ children }: any) => <>{children}</>;
const SelectValue = ({ placeholder }: any) => <option value="">{placeholder}</option>;
const SelectContent = ({ children }: any) => <>{children}</>;
const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;

const Dialog = ({ children, open, onOpenChange }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-lg max-w-4xl w-full m-4" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
const DialogContent = ({ children, className = "" }: any) => <div className={className}>{children}</div>;
const DialogHeader = ({ children }: any) => <div className="px-6 py-4 border-b">{children}</div>;
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold">{children}</h2>;
const DialogTrigger = ({ children, asChild }: any) => <>{children}</>;

const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>;
const FormField = ({ control, name, render }: { control: any; name: string; render: (props: { field: any }) => React.ReactNode }) => {
  const [value, setValue] = useState('');
  const field = { value, onChange: setValue };
  return render({ field } as { field: any });
};
const FormItem = ({ children }: any) => <div className="space-y-2">{children}</div>;
const FormLabel = ({ children }: any) => <label className="block text-sm font-medium text-gray-700">{children}</label>;
const FormControl = ({ children }: any) => <>{children}</>;
const FormMessage = ({ children }: any) => children ? <p className="text-sm text-red-600">{children}</p> : null;

const Alert = ({ children }: any) => <div className="bg-blue-50 border border-blue-200 rounded-md p-4">{children}</div>;
const AlertDescription = ({ children }: any) => <div className="text-sm text-blue-700">{children}</div>;

// Form schemas
const billItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hsnCode: z.string().min(1, 'HSN code is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  gstRate: z.number().min(0).max(28, 'GST rate must be between 0-28%')
});

const createBillSchema = z.object({
  billNumber: z.string().min(1, 'Bill number is required'),
  billType: z.enum(['purchase_bill', 'sales_bill', 'service_bill', 'debit_note', 'credit_note']),
  vendorName: z.string().min(1, 'Vendor name is required'),
  vendorGstin: z.string().optional(),
  vendorEmail: z.string().email().optional().or(z.literal('')),
  vendorPhone: z.string().optional(),
  vendorAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().min(1, 'Pincode is required'),
    country: z.string().default('India')
  }),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  discountAmount: z.number().min(0).default(0),
  tdsAmount: z.number().min(0).default(0),
  billItems: z.array(billItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional()
});

const paymentSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  paidAmount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other']),
  paymentReference: z.string().optional(),
  notes: z.string().optional()
});

// Utility functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatusColor = (status: string): string => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    partially_paid: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || colors.draft;
};

const getBillTypeDisplay = (billType: string): string => {
  const types = {
    purchase_bill: 'Purchase Bill',
    sales_bill: 'Sales Bill',
    service_bill: 'Service Bill',
    debit_note: 'Debit Note',
    credit_note: 'Credit Note'
  };
  return types[billType as keyof typeof types] || billType;
};

// Components
const BillSummaryCards: React.FC<{ summary: BillSummary }> = ({ summary }) => {
  const { formatAmount } = useCurrency();
  return (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Bills</p>
            <p className="text-2xl font-bold">{summary.totalBills}</p>
          </div>
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pendingBills}</p>
          </div>
          <Calendar className="h-8 w-8 text-yellow-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{summary.overdueBills}</p>
          </div>
          <Calendar className="h-8 w-8 text-red-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-green-600">{summary.paidBills}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Amount</p>
            <p className="text-lg font-bold">{formatAmount(summary.totalAmount)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending Amount</p>
            <p className="text-lg font-bold text-orange-600">{formatAmount(summary.pendingAmount)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-orange-600" />
        </div>
      </CardContent>
    </Card>
  </div>
  );
};

const BillForm: React.FC<{
  bill?: Bill;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ bill, onSubmit, onCancel, isLoading = false }) => {
  const form = useForm({
    resolver: zodResolver(createBillSchema),
    defaultValues: bill ? {
      ...bill,
      billDate: bill.billDate.split('T')[0],
      dueDate: bill.dueDate.split('T')[0]
    } : {
      billNumber: '',
      billType: 'purchase_bill' as const,
      vendorName: '',
      vendorGstin: '',
      vendorEmail: '',
      vendorPhone: '',
      vendorAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discountAmount: 0,
      tdsAmount: 0,
      billItems: [{
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        gstRate: 18
      }],
      notes: '',
      termsAndConditions: ''
    }
  });

  const [billItems, setBillItems] = useState(form.getValues('billItems'));

  const addBillItem = () => {
    const newItem = {
      description: '',
      hsnCode: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      gstRate: 18
    };
    const updatedItems = [...billItems, newItem];
    setBillItems(updatedItems);
    form.setValue('billItems', updatedItems);
  };

  const removeBillItem = (index: number) => {
    const updatedItems = billItems.filter((_, i) => i !== index);
    setBillItems(updatedItems);
    form.setValue('billItems', updatedItems);
  };

  const updateBillItem = (index: number, field: string, value: any) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setBillItems(updatedItems);
    form.setValue('billItems', updatedItems);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="billNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter bill number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="billType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bill type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="purchase_bill">Purchase Bill</SelectItem>
                    <SelectItem value="sales_bill">Sales Bill</SelectItem>
                    <SelectItem value="service_bill">Service Bill</SelectItem>
                    <SelectItem value="debit_note">Debit Note</SelectItem>
                    <SelectItem value="credit_note">Credit Note</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter vendor name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="vendorGstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor GSTIN</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter GSTIN" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vendorEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="Enter email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="vendorPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter phone number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Vendor Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vendor Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vendorAddress.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter street address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendorAddress.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="vendorAddress.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter state" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendorAddress.pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter pincode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendorAddress.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter country" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="billDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bill Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bill Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bill Items</h3>
            <Button type="button" onClick={addBillItem}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {billItems.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input
                        value={item.description}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateBillItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">HSN Code</label>
                      <Input
                        value={item.hsnCode}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateBillItem(index, 'hsnCode', e.target.value)}
                        placeholder="HSN code"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantity</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateBillItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Quantity"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit</label>
                      <Input
                        value={item.unit}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateBillItem(index, 'unit', e.target.value)}
                        placeholder="Unit"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Rate (₹)</label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="Rate"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">GST%</label>
                      <Input
                        type="number"
                        value={item.gstRate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateBillItem(index, 'gstRate', parseFloat(e.target.value) || 0)}
                        placeholder="GST%"
                        max="28"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  {billItems.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeBillItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discountAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tdsAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TDS Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="termsAndConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Terms & Conditions</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter terms and conditions"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : bill ? 'Update Bill' : 'Create Bill'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const PaymentForm: React.FC<{
  bill: Bill;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ bill, onSubmit, onCancel, isLoading = false }) => {
  const { formatAmount } = useCurrency();
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paidAmount: 0,
      paymentMethod: 'bank_transfer' as const,
      paymentReference: '',
      notes: ''
    }
  });

  const totalPaid = bill.payments.reduce((sum, payment) => sum + payment.paidAmount, 0);
  const remainingAmount = bill.totalAmount - totalPaid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="font-medium">Total: </span>
                {formatAmount(bill.totalAmount)}
              </div>
              <div>
                <span className="font-medium">Paid: </span>
                {formatAmount(totalPaid)}
              </div>
              <div>
                <span className="font-medium">Remaining: </span>
                {formatAmount(remainingAmount)}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="paidAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    max={remainingAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="paymentReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Reference</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Transaction ID, Cheque No, etc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Payment notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Payment'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Main Component
const BillManagement: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillSummary>({
    totalBills: 0,
    pendingBills: 0,
    overdueBills: 0,
    paidBills: 0,
    totalAmount: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    billType: '',
    status: '',
    vendorName: '',
    fromDate: '',
    toDate: ''
  });
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    loadBills();
    loadSummary();
  }, [filters]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await billService.getAll(filters);
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await billService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleCreateBill = async (data: any) => {
    try {
      setLoading(true);
      await billService.create(data);
      setShowCreateForm(false);
      loadBills();
      loadSummary();
    } catch (error) {
      console.error('Error creating bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBill = async (data: any) => {
    if (!selectedBill) return;
    
    try {
      setLoading(true);
      await billService.update(selectedBill.id, data);
      setShowEditForm(false);
      setSelectedBill(null);
      loadBills();
      loadSummary();
    } catch (error) {
      console.error('Error updating bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm(`Are you sure you want to delete bill ${bill.billNumber}?`)) return;
    
    try {
      setLoading(true);
      await billService.delete(bill.id);
      loadBills();
      loadSummary();
    } catch (error) {
      console.error('Error deleting bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBill = async (bill: Bill) => {
    try {
      setLoading(true);
      await billService.approve(bill.id);
      loadBills();
      loadSummary();
    } catch (error) {
      console.error('Error approving bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (data: any) => {
    if (!selectedBill) return;
    
    try {
      setLoading(true);
      await billService.addPayment(selectedBill.id, data);
      setShowPaymentForm(false);
      setSelectedBill(null);
      loadBills();
      loadSummary();
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadGSTReport = async () => {
    if (!filters.fromDate || !filters.toDate) {
      alert('Please select date range for GST report');
      return;
    }
    
    try {
      await billService.downloadGSTReport(filters.fromDate, filters.toDate);
    } catch (error) {
      console.error('Error downloading GST report:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bill Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handleDownloadGSTReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            GST Report
          </Button>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
              </DialogHeader>
              <BillForm
                onSubmit={handleCreateBill}
                onCancel={() => setShowCreateForm(false)}
                isLoading={loading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <BillSummaryCards summary={summary} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filters.billType} onValueChange={(value: string) => setFilters({ ...filters, billType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Bill Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="purchase_bill">Purchase Bill</SelectItem>
                <SelectItem value="sales_bill">Sales Bill</SelectItem>
                <SelectItem value="service_bill">Service Bill</SelectItem>
                <SelectItem value="debit_note">Debit Note</SelectItem>
                <SelectItem value="credit_note">Credit Note</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value: string) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Vendor Name"
              value={filters.vendorName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, vendorName: e.target.value })}
            />

            <Input
              type="date"
              placeholder="From Date"
              value={filters.fromDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, fromDate: e.target.value })}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.toDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, toDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading bills...
                  </TableCell>
                </TableRow>
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(bills) ? bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{getBillTypeDisplay(bill.billType)}</TableCell>
                    <TableCell>{bill.vendorName}</TableCell>
                    <TableCell>{formatDate(bill.billDate)}</TableCell>
                    <TableCell>{formatDate(bill.dueDate)}</TableCell>
                    <TableCell>{formatAmount(bill.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bill.status)}>
                        {bill.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => billService.downloadPDF(bill.id)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Bill Details - {bill.billNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="font-medium">Vendor: </span>
                                  {bill.vendorName}
                                </div>
                                <div>
                                  <span className="font-medium">Amount: </span>
                                  {formatAmount(bill.totalAmount)}
                                </div>
                                <div>
                                  <span className="font-medium">Status: </span>
                                  <Badge className={getStatusColor(bill.status)}>
                                    {bill.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="font-medium">GST: </span>
                                  {formatAmount(bill.cgstAmount + bill.sgstAmount + bill.igstAmount)}
                                </div>
                              </div>
                              
                              {bill.payments.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Payments</h4>
                                  <div className="space-y-2">
                                    {bill.payments.map((payment, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <span>{formatDate(payment.paymentDate)} - {payment.paymentMethod}</span>
                                        <span>{formatAmount(payment.paidAmount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {bill.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowEditForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}

                        {bill.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveBill(bill)}
                          >
                            Approve
                          </Button>
                        )}

                        {(bill.status === 'approved' || bill.status === 'partially_paid') && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowPaymentForm(true);
                            }}
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}

                        {bill.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBill(bill)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : null
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Bill Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill - {selectedBill?.billNumber}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <BillForm
              bill={selectedBill}
              onSubmit={handleUpdateBill}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedBill(null);
              }}
              isLoading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment - {selectedBill?.billNumber}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <PaymentForm
              bill={selectedBill}
              onSubmit={handleAddPayment}
              onCancel={() => {
                setShowPaymentForm(false);
                setSelectedBill(null);
              }}
              isLoading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillManagement;
