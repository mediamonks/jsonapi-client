import {ApiQuery} from "./ApiQuery";
import {Api} from "./Api";
import {ascend, descend} from "./ApiSortRule";

describe('ApiQuery', () => {
  const defaultApi = new Api(new URL('https://www.example.com/api'));

  describe('ApiQuery class', () => {
    it('should return empty string for empty values', () => {
      const apiQuery = new ApiQuery(defaultApi, {});

      expect(apiQuery.toString()).toEqual('');
    });

    it('should return empty string for empty field values', () => {
      const apiQuery = new ApiQuery(defaultApi, {
        page: {},
        fields: {},
        filter: {},
        include: {},
        sort: [],
      });

      expect(apiQuery.toString()).toEqual('');
    });

    describe('page', () => {
      it('should return page values', () => {
        const apiQuery = new ApiQuery(new Api(new URL('https://www.example.com/api'), {
          createPageQuery: (page:any) => ({
            foo: page.number,
            bar: page.string,
            baz: page.bool,
            qux: page.boolFalse,
          })
        }), {
          page: {
            number: 1,
            string: 'foo',
            bool: true,
            boolFalse: false,
          },
        });

        expect(apiQuery.toString()).toEqual('?page[foo]=1&page[bar]=foo&page[baz]');
      });

      // TODO: setupPage function
    });

    describe('sort', () => {
      it('should return sort a single value ascending', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          sort: [ascend('foo')] as any,
        });

        expect(apiQuery.toString()).toEqual('?sort=foo');
      });

      it('should return sort a single value descending', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          sort: [descend('bar')] as any,
        });

        expect(apiQuery.toString()).toEqual('?sort=-bar');
      });

      it('should return sort multiple values ascending and descending', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          sort: [ascend('foo'), descend('bar')] as any,
        });

        expect(apiQuery.toString()).toEqual('?sort=foo,-bar');
      });
    });

    describe('filter', () => {

      it('should return filter an array of string and number', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          filter: {
            a: 'foo',
            b: 1,
            c: true,
            d: false,
          }
        });

        expect(apiQuery.toString()).toEqual('?filter[a]=foo&filter[b]=1&filter[c]');
      });

    });

    describe('fields', () => {

      it('should request a single resource field', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          fields: {
            foo: [
              'bar'
            ]
          },
        });

        expect(apiQuery.toString()).toEqual('?fields[foo]=bar');
      });

      it('should request multiple resource fields', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          fields: {
            foo: [
              'bar',
              'baz'
            ]
          },
        });

        expect(apiQuery.toString()).toEqual('?fields[foo]=bar,baz');
      });

      it('should request a single resource field on multiple resources', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          fields: {
            foo: [
              'bar',
            ],
            baz: [
              'qux',
            ]
          },
        });

        expect(apiQuery.toString()).toEqual('?fields[foo]=bar&fields[baz]=qux');
      });
    });

    describe('includes', () => {

      it('should include a single relationship', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          include: {
            foo: null,
          },
        });

        expect(apiQuery.toString()).toEqual('?include=foo');
      });

      it('should include multiple relationships', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          include: {
            foo: null,
            bar: null,
          },
        });

        expect(apiQuery.toString()).toEqual('?include=foo,bar');
      });

      it('should include a nested relationship', () => {
        const apiQuery = new ApiQuery(defaultApi, {
          include: {
            foo: {
              bar: null,
            },
          },
        });

        expect(apiQuery.toString()).toEqual('?include=foo.bar');
      });
    });

    it('should return a full string for large example values', () => {
      const apiQuery = new ApiQuery(defaultApi, {
        page: {
          number: 1,
          size: 1,
        },
        fields: {
          videoSession: [
            'discipline',
            'broadcastStart',
            'broadcastEnd',
            'eventUnits',
            'title',
          ],
          discipline: ['name'],
          eventUnit: [
            'startDate',
            'startTime',
            'finishDate',
            'finishTime',
            'zoneOffset',
            'phase',
          ],
        },
        include: {
          discipline: null,
          eventUnits: {
            phase: null,
          },
        },
        sort: [ascend('foo'), descend('bar')] as any,
      });

      const expected = `?${[
        'page[number]=1&page[size]=1',
        'fields[videoSession]=discipline,broadcastStart,broadcastEnd,eventUnits,title&fields[discipline]=name&fields[eventUnit]=startDate,startTime,finishDate,finishTime,zoneOffset,phase',
        'include=discipline,eventUnits.phase',
        'sort=foo,-bar',
      ].join('&')}`

      expect(apiQuery.toString()).toEqual(expected);
    });
  });
});
