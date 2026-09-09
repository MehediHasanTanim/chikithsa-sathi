import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  ClipboardPlus,
  FileText,
  FlaskConical,
  Plus,
  Stethoscope,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const metrics = [
  {
    label: "Today's Appointments",
    value: '28',
    note: '24 completed',
    trend: '↑ 12%',
    icon: CalendarDays,
    color: 'blue',
  },
  {
    label: 'Waiting Patients',
    value: '6',
    note: 'Avg. wait time: 18 min',
    trend: '↑ 25%',
    icon: UsersRound,
    color: 'purple',
  },
  {
    label: 'New Patients',
    value: '5',
    note: 'vs. last week',
    trend: '↑ 67%',
    icon: UserPlus,
    color: 'green',
  },
  {
    label: 'Completed Today',
    value: '24',
    note: 'Completed visits',
    trend: '↑ 20%',
    icon: Activity,
    color: 'amber',
  },
  {
    label: 'Cancelled / No-show',
    value: '2',
    note: 'Appointments',
    trend: '↓ 50%',
    icon: ClipboardPlus,
    color: 'red',
  },
  {
    label: "Today's Revenue",
    value: '৳ 12,500',
    note: '32 payments',
    trend: '↑ 18%',
    icon: CircleDollarSign,
    color: 'teal',
  },
] as const;

const schedule = [
  ['10:00 AM', '001', 'Md. Hasan Ali', 'Follow-up', 'Completed', 'View'],
  ['10:30 AM', '002', 'Nusrat Jahan', 'New Patient', 'In Consultation', 'Consult'],
  ['11:00 AM', '003', 'Rahima Begum', 'Follow-up', 'Waiting', 'Start'],
  ['11:30 AM', '004', 'Tanvir Ahmed', 'New Patient', 'Waiting', 'Start'],
  ['12:00 PM', '005', 'Farzana Islam', 'Follow-up', 'Scheduled', 'View'],
] as const;

const quickActions = [
  ['New Patient', Plus],
  ['New Appointment', CalendarDays],
  ['Start Consultation', Stethoscope],
  ['Write Prescription', FileText],
  ['Order Investigation', FlaskConical],
  ['View Reports', Activity],
] as const;

const recentPatients = [
  ['TA', 'Tanvir Ahmed', 'Today, 12:20 PM', 'Follow-up'],
  ['FI', 'Farzana Islam', 'Today, 11:45 AM', 'New patient'],
  ['KH', 'Khaled Hossain', 'Today, 10:30 AM', 'Follow-up'],
  ['SA', 'Sabrina Ahmed', 'Yesterday, 4:20 PM', 'Follow-up'],
];

export default function DashboardPage() {
  return (
    <div className="care-dashboard">
      <PageHeader
        title="Good evening, Dr. Arafat"
        description="Here's your practice overview for today."
      />
      <div className="care-metrics">
        {metrics.map(({ label, value, note, trend, icon: Icon, color }) => (
          <article className="care-metric" key={label}>
            <span className={`care-metric-icon care-metric-icon--${color}`}>
              <Icon className="size-6" />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <em className={trend.startsWith('↓') ? 'down' : ''}>{trend}</em>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="care-dashboard-grid">
        <section className="care-panel care-schedule">
          <div className="care-panel-heading">
            <h2>Today&apos;s Schedule</h2>
            <Link href="/appointments">View All</Link>
          </div>
          <div className="care-tabs">
            <button className="active">All (28)</button>
            <button>Scheduled (6)</button>
            <button>In Consultation (3)</button>
            <button>Completed (24)</button>
          </div>
          <div className="care-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Visit Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(([time, token, patient, type, status, action]) => (
                  <tr key={token}>
                    <td>{time}</td>
                    <td>{token}</td>
                    <td>{patient}</td>
                    <td>{type}</td>
                    <td>
                      <Badge
                        tone={
                          status === 'Completed'
                            ? 'success'
                            : status === 'Waiting'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {status}
                      </Badge>
                    </td>
                    <td>
                      <Button size="sm" variant={action === 'Start' ? 'primary' : 'secondary'}>
                        {action}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="care-panel care-queue">
          <div className="care-panel-heading">
            <h2>
              Current Queue <Badge tone="success">● Live</Badge>
            </h2>
            <Link href="/queue">View Queue</Link>
          </div>
          <span className="care-serving-label">Now Serving</span>
          <div className="care-serving">
            <b>002</b>
            <span className="care-avatar">NJ</span>
            <div>
              <strong>Nusrat Jahan</strong>
              <small>30 yrs · Female · New Patient</small>
            </div>
            <time>
              Since 10:32 AM
              <br />
              <strong>00:18:24</strong>
            </time>
          </div>
          <p className="care-next-label">Next in Queue</p>
          <div className="care-next">
            <b>003</b>
            <div>
              <strong>Rahima Begum</strong>
              <small>45 yrs · Female · Follow-up</small>
            </div>
            <Badge tone="warning">Waiting</Badge>
          </div>
          <div className="care-queue-stats">
            <div>
              <UsersRound />
              <strong>6</strong>
              <span>Waiting</span>
            </div>
            <div>
              <Activity />
              <strong>18 min</strong>
              <span>Avg. wait time</span>
            </div>
            <div>
              <Stethoscope />
              <strong>2</strong>
              <span>In consultation</span>
            </div>
          </div>
        </section>
        <aside className="care-side-stack">
          <section className="care-panel care-quick">
            <div className="care-panel-heading">
              <h2>Quick Actions</h2>
              <Link href="/settings">✧ Customize</Link>
            </div>
            <div>
              {quickActions.map(([label, Icon]) => (
                <Button variant="secondary" key={label}>
                  <Icon className="size-4" />
                  {label}
                </Button>
              ))}
            </div>
          </section>
          <section className="care-panel care-recent">
            <div className="care-panel-heading">
              <h2>Recent Patients</h2>
              <Link href="/patients">View All</Link>
            </div>
            {recentPatients.map(([initials, name, time, type]) => (
              <div className="care-patient-row" key={name}>
                <span>{initials}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{time}</small>
                </div>
                <em>{type}</em>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
