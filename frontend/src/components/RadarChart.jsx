import React from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function RadarChart({ radarData }) {
  const data = radarData && radarData.labels ? radarData.labels.map((label, index) => ({
    subject: label,
    A: radarData.scores[index],
    fullMark: 100
  })) : [];

  if (data.length === 0) {
    return <div style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No radar data available.</div>;
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-light)', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Student" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
