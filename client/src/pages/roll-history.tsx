import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, History, Search } from 'lucide-react';
import { format } from 'date-fns';
import { usePageContext } from '@/contexts/page-context';
import { useEffect, useState, useMemo } from 'react';

export default function RollHistory() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { setPageTitle } = usePageContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: api.inventory.list,
  });

  const item = inventory.find((inv: any) => inv._id === id || inv.id === id);

  useEffect(() => {
    if (item) {
      setPageTitle(`Roll History - ${item.category}`, "Detailed transaction history for this category");
    } else {
      setPageTitle("Roll History", "Detailed transaction history");
    }
  }, [item, setPageTitle]);

  const filteredHistory = useMemo(() => {
    if (!item?.history) return [];
    
    let history = [...item.history];

    // Filter by search query (Roll Name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      history = history.filter(entry => 
        (entry.description || entry.rollName || '').toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      history = history.filter(entry => {
        const type = (entry.type || '').toUpperCase();
        if (filterType === 'STOCK IN') return type === 'IN' || type === 'STOCK IN';
        if (filterType === 'STOCK OUT') return type === 'OUT' || type === 'STOCK OUT';
        return false;
      });
    }

    // Sort
    history.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.date).getTime();
      const dateB = new Date(b.timestamp || b.date).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return history;
  }, [item, searchQuery, filterType, sortBy]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading history...</div>;
  }

  if (!item) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Category not found or no history available.</p>
        <Button onClick={() => setLocation('/inventory')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" onClick={() => setLocation('/inventory')} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
        </Button>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Category: {item.category}</h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Roll Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-40 bg-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="STOCK IN">Stock In</SelectItem>
            <SelectItem value="STOCK OUT">Stock Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-40 bg-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-muted">
                <tr className="border-b border-slate-300">
                  <th className="px-4 py-3 border-r border-slate-300">Date & Time</th>
                  <th className="px-4 py-3 border-r border-slate-300">Type</th>
                  <th className="px-4 py-3 border-r border-slate-300">Roll Name</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((entry: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/50 transition-colors border-b border-slate-300 last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap border-r border-slate-300">
                        {format(new Date(entry.timestamp || entry.date), 'dd/MM/yyyy, hh:mm:ss a')}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-300">
                        <Badge variant={entry.type === 'IN' || entry.type === 'STOCK IN' ? 'default' : 'destructive'} className="text-[10px] px-1 py-0 h-4">
                          {entry.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium border-r border-slate-300">
                        {entry.description || entry.rollName || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${entry.type === 'IN' || entry.type === 'STOCK IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'IN' || entry.type === 'STOCK IN' ? '+' : ''}{entry.amount || entry.quantity} <span className="text-[10px] font-normal text-muted-foreground ml-1">sqft</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No matching history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
