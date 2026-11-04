import { describe, expect, it } from 'vitest';
import { prepareXodrForModuleOpenDrive } from './prepareXodrForModuleOpenDrive';

const XODR = `<?xml version="1.0"?><OpenDRIVE><header/><road id="tiny" name="Связка" length="0.001" junction="1"><planView><geometry s="0" x="1" y="2" hdg="0" length="0.001"><paramPoly3 aU="0" bU="0.001" cU="0" dU="0" aV="0" bV="0" cV="0" dV="0" pRange="normalized"/></geometry></planView><lanes/></road><road id="curve" name="Улица" length="2" junction="-1"><planView><geometry s="0" x="0" y="0" hdg="0" length="2"><paramPoly3 aU="0" bU="2" cU="0" dU="0" aV="0" bV="0" cV="0" dV="0" pRange="normalized"/></geometry></planView><lanes/></road></OpenDRIVE>`;

describe('prepareXodrForModuleOpenDrive', () => {
  it('keeps the canonical input unchanged when no adaptation is needed', () => {
    const plain =
      '<OpenDRIVE><header/><road id="1" name="Road" length="1" junction="-1"><planView><geometry s="0" x="0" y="0" hdg="0" length="1"><line/></geometry></planView></road></OpenDRIVE>';
    expect(prepareXodrForModuleOpenDrive(plain)).toBe(plain);
  });

  it('converts paramPoly3, ASCII-normalizes names, and preserves short connectors', () => {
    const prepared = prepareXodrForModuleOpenDrive(XODR);
    const document = new DOMParser().parseFromString(
      prepared,
      'application/xml'
    );
    const roads = Array.from(document.getElementsByTagName('road'));

    expect(roads).toHaveLength(2);
    expect(roads.map((road) => road.getAttribute('name'))).toEqual([
      'road_tiny',
      'road_curve',
    ]);
    expect(document.querySelector('paramPoly3')).toBeNull();
    expect(Number(roads[0].getAttribute('length'))).toBe(0.3);
    expect(
      Array.from(document.getElementsByTagName('geometry')).every(
        (geometry) => Number(geometry.getAttribute('length')) >= 0.3
      )
    ).toBe(true);
    expect(roads[0].getAttribute('junction')).toBe('1');
  });
});
