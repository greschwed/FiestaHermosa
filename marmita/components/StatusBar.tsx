import Icon from './Icon';

export default function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Icon name="bell" size={14} />
        <span style={{
          width: 14, height: 7,
          border: '1.4px solid #2a1f17',
          borderRadius: 2,
          position: 'relative',
          display: 'inline-block',
        }}>
          <span style={{
            position: 'absolute', inset: 1,
            background: '#2a1f17', width: '80%', borderRadius: 1,
          }} />
        </span>
      </span>
    </div>
  );
}
