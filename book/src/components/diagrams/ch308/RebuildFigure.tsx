import { Svg, T, tok } from '../../viz/svg';
import { EDGES, Edge, NODES, Node } from './graph';

// Chapter 308: when c's interface changes, every module that can reach c
// along import arrows must be compiled again; d cannot, so it is reused.
const REBUILD = ['c', 'a', 'b', 'main'];

export default function RebuildFigure() {
  return (
    <Svg w={400} h={214} title="c has changed; a, b and main import it directly or indirectly and are rebuilt; d is reused">
      {EDGES.map(([a, b]) => <Edge key={a + b} from={a} to={b} hot={REBUILD.includes(a) && REBUILD.includes(b)} />)}
      {Object.keys(NODES).map((id) => (
        <Node key={id} id={id} fill={id === 'c' ? tok('f6', 0.2) : REBUILD.includes(id) ? tok('brand', 0.12) : tok('panel')}
          stroke={id === 'c' ? tok('f6') : REBUILD.includes(id) ? tok('brand') : tok('line')} />
      ))}
      <T x={340} y={162} size={11} fill={tok('muted')}>reused</T>
      <T x={72} y={162} size={11} anchor="end" fill={tok('muted')}>edited</T>
      <T x={200} y={196} size={11} anchor="middle" fill={tok('muted')}>Rebuild c, then a and b, then main: everything that reaches c.</T>
    </Svg>
  );
}
