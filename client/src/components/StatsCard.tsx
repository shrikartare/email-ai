import type { ReactNode } from 'react';

interface StatsCardProps {
    icon: ReactNode;
    value: number | string;
    label: string;
    color: 'blue' | 'teal' | 'purple' | 'amber' | 'red' | 'green';
}

const StatsCard = ({ icon, value, label, color }: StatsCardProps) => {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-info">
                <h3>{value}</h3>
                <p>{label}</p>
            </div>
        </div>
    );
};

export default StatsCard;
