"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, RefreshCw } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    const action = log.action || "";
    const operator = log.user?.name || log.operator || "";
    const entityType = log.entity_type || "";
    
    return (
      action.toLowerCase().includes(term) ||
      operator.toLowerCase().includes(term) ||
      entityType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <ShieldCheck className="w-6 h-6 text-[#c8410a]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-slate-900">System Audit Logs</h1>
            <p className="text-sm text-slate-500">Read-only immutable timeline of administrative overrides and changes</p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={fetchLogs} className="h-9">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Logs
        </Button>
      </div>

      {/* Filters & Table */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search logs by action, details or operator..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Operator</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Category / IP Address</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading audit history...</td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No logs found matching search.</td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const timestamp = log.created_at || log.timestamp || new Date().toISOString();
                    const operatorName = log.user?.name || log.operator || "System";
                    const actionName = log.action || "Action";
                    const ipAddr = log.ip_address || "—";
                    const entity = log.entity_type || "Config";
                    
                    // Format diff or value representation as description
                    let details = log.details;
                    if (!details) {
                      if (log.new_value) {
                        details = `Modified ${entity} (${log.entity_id}): ${JSON.stringify(log.new_value)}`;
                      } else {
                        details = `${actionName} performed on ${entity}`;
                      }
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {new Date(timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{operatorName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            actionName.includes('Approved') || actionName.includes('Create') || actionName.includes('login')
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {actionName}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{entity} ({ipAddr})</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{details}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
