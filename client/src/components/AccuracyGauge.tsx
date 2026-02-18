interface AccuracyGaugeProps {
    value: number;
    size?: number;
}

const AccuracyGauge = ({ value, size = 120 }: AccuracyGaugeProps) => {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const getColor = (v: number) => {
        if (v >= 80) return 'var(--accent-green)';
        if (v >= 60) return 'var(--accent-amber)';
        return 'var(--accent-red)';
    };

    return (
        <div className="accuracy-gauge">
            <div className="gauge-circle" style={{ width: size, height: size }}>
                <svg width={size} height={size}>
                    <circle
                        className="bg"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                    />
                    <circle
                        className="progress"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={getColor(value)}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <span className="gauge-value" style={{ color: getColor(value) }}>
                    {value}%
                </span>
            </div>
            <span className="gauge-label">Accuracy Score</span>
        </div>
    );
};

export default AccuracyGauge;
