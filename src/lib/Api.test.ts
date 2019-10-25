import {ApiQuery} from "./ApiQuery";
import {Api} from "./Api";
import set = Reflect.set;
import {jsonApiVersions} from "../constants/jsonApi";
import {defaultIncludeFieldOptions} from "../constants/setup";


import { isString } from 'isntnt'
import {resource} from "./Resource";
import {requiredAttribute} from "./ResourceAttribute";

export class Asset extends resource('Asset')<Asset> {
  @requiredAttribute(isString) public assetType!: string
  @requiredAttribute(isString) public name!: string
  @requiredAttribute(isString) public alt!: string
}

describe('Api', () => {


  describe('Api class', () => {
    describe('constructor', () => {
      it('should create a new default instancee', () => {
        const url = 'https://www.example.com/api';
        const api = new Api(new URL(url));

        expect(api.url.href).toEqual(url);
        expect(api.setup.createPageQuery).toBeDefined();
        expect(api.setup.version).toBeDefined();
        expect(api.setup.defaultIncludeFields).toBeDefined();
        expect(api.setup.parseRequestError).toBeDefined();
      });
      it('should merge the default setup properly', () => {
        const url = 'https://www.example.com/api';
        const setup = {
          createPageQuery: (page:any) => ({
            foo: 'bar'
          }),
          version: jsonApiVersions['1_1'],
          defaultIncludeFields: defaultIncludeFieldOptions.PRIMARY,
          parseRequestError: (all:any) => all,
        };
        const api = new Api(new URL(url), setup);

        expect(api.setup.createPageQuery).toEqual(setup.createPageQuery);
        expect(api.setup.version).toEqual(setup.version);
        expect(api.setup.defaultIncludeFields).toEqual(setup.defaultIncludeFields);
        expect(api.setup.parseRequestError).toEqual(setup.parseRequestError);
      });
    });

    describe('endpoint', () => {
      it('should retrieve the endpoint', () => {
        const url = 'https://www.example.com/api';
        const api = new Api(new URL(url));

        const endpoint = api.endpoint('/foo', Asset);

        expect(endpoint.api).toEqual(api);
      })

      it('should retrieve the endpoint', () => {
        const url = 'https://www.example.com/api';
        const api = new Api(new URL(url));

        const endpoint = api.endpoint('/foo', Asset);

        expect(endpoint.api.controller.resources['Asset']).toEqual(Asset);
      })
    })
  });
});
