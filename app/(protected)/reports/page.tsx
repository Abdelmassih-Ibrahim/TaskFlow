'use client';

import { useState, useMemo } from 'react';
import { Check, ListTodo, Clock3, TrendingUp } from 'lucide-react';
import { getWorkspaceSummary, getProjectProgress } from '@/lib/workspace/dashboard';
import { calculateBurndownData, calculateVelocity, getProjectSummaries, getStatusDistribution } from '@/lib/workspace/reports';
import { SummaryCard } from '@/components/summary-card';
import type { WorkspaceData } from '@/lib/workspace/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage({ projects, tasks, error }: WorkspaceData) {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  if (error) {
    return (
      <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-[1320px]">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <h1 className="text-lg font-semibold text-rose-900">Rapporter är inte tillgängliga</h1>
            <p className="mt-1 text-sm text-rose-800">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const summary = useMemo(() => getWorkspaceSummary(tasks), [tasks]);
  const projectReports = useMemo(() => getProjectSummaries(tasks), [tasks]);
  const burndownData = useMemo(() => calculateBurndownData(tasks), [tasks]);
  const velocityData = useMemo(() => calculateVelocity(tasks), [tasks]);
  const statusDistribution = useMemo(() => getStatusDistribution(tasks), [tasks]);

  return (
    <main className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:ml-[248px] lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1320px] space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
            Rapporter
            <span className="text-teal-600">.</span>
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">Insikt i ditt arbete och framsteg</p>
        </div>

        {/* KPI Cards */}
        <section aria-label="Nyckeltal för arbetsytan">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Översikt</h2>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'all')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="week">Denna vecka</option>
              <option value="month">Denna månad</option>
              <option value="all">All tid</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard
              label="Totalt antal uppgifter"
              value={summary.total}
              description="I alla dina projekt"
              icon={ListTodo}
              iconClass="bg-blue-50 text-blue-700"
            />
            <SummaryCard
              label="Slutförda"
              value={summary.completed}
              description="Uppgifter markerade som klara"
              icon={Check}
              iconClass="bg-emerald-50 text-emerald-700"
            />
            <SummaryCard
              label="Försenade"
              value={summary.overdue}
              description="Oavslutade med passerat datum"
              icon={Clock3}
              iconClass="bg-rose-50 text-rose-700"
            />
          </div>
        </section>

        {/* Charts Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Burndown Chart */}
          {burndownData.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Burndown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={burndownData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Line type="monotone" dataKey="todo" stroke="#cbd5e1" name="Att göra" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="in_progress"
                    stroke="#3b82f6"
                    name="Pågår"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="done" stroke="#10b981" name="Klar" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* Velocity Chart */}
          {velocityData.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Velocity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={velocityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="completed" fill="#10b981" name="Klara uppgifter" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}
        </div>

        {/* Status Distribution */}
        {statusDistribution.some((s) => s.value > 0) && (
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Status fördelning</h3>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Per-Project Stats */}
        {projectReports.length > 0 && (
          <section aria-label="Projekt statistik">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Per projekt</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Projekt</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Totalt</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Klara</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Förlopp</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Försenade</th>
                  </tr>
                </thead>
                <tbody>
                  {projectReports.map((project) => (
                    <tr key={project.projectId} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{project.projectName}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{project.total}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{project.completed}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${project.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">{project.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {project.overdue > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                            <Clock3 size={12} />
                            {project.overdue}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <ListTodo size={32} className="mx-auto mb-3 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Inga uppgifter ännu</h3>
            <p className="mt-1 text-sm text-slate-600">
              Skapa dina första projekt och uppgifter för att se rapporter här.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
