import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { propertySchema, vehicleSchema, registerSchema, loginSchema } from './validation.js'

describe('propertySchema coercion', () => {
  it('coerces numeric strings and strips null/empty optional fields', () => {
    const parsed = propertySchema.safeParse({
      title: '3BR House',
      type: 'House',
      listingType: 'For Sale',
      price: '1250000',
      priceType: 'Fixed Price',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      area: '250',
      bedrooms: null,
      bathrooms: '',
      legalizedYear: '2021',
      locationDocument: null,
      features: [],
    })
    assert.ok(parsed.success)
    if (!parsed.success) return
    assert.equal(parsed.data.price, 1250000)
    assert.equal(parsed.data.area, 250)
    assert.equal(parsed.data.legalizedYear, 2021)
    assert.equal(parsed.data.bedrooms, undefined)
    assert.equal(parsed.data.bathrooms, undefined)
    assert.equal(parsed.data.locationDocument, undefined)
  })

  it('accepts plain numbers (web form sends strings, native sends numbers)', () => {
    const parsed = propertySchema.safeParse({
      title: 'Apartment',
      type: 'Apartment',
      listingType: 'For Rent',
      price: 7000,
      priceType: 'per month',
      region: 'Oromia',
      city: 'Adama',
      bedrooms: 2,
    })
    assert.ok(parsed.success)
    if (!parsed.success) return
    assert.equal(parsed.data.price, 7000)
    assert.equal(parsed.data.bedrooms, 2)
  })

  it('rejects non-numeric required price', () => {
    const parsed = propertySchema.safeParse({
      title: 'x',
      type: 'House',
      listingType: 'For Sale',
      price: 'abc',
      priceType: 'Fixed',
      region: 'r',
      city: 'c',
    })
    assert.equal(parsed.success, false)
  })

  it('accepts optional booleans set to false (not stripped)', () => {
    const parsed = vehicleSchema.safeParse({
      title: 'Car',
      vehicleId: 'C-1',
      listingType: 'For Sale',
      vehicleCategory: 'Sedan',
      make: 'Toyota',
      vehicleModel: 'Camry',
      manufacturingYear: '2020',
      color: 'Red',
      countryOfOrigin: 'Japan',
      condition: 'Used',
      region: 'AA',
      city: 'AA',
      price: '100000',
      priceType: 'Fixed Price',
      accidentFree: false,
      import: null,
      safetyFeatures: null,
    })
    assert.ok(parsed.success)
    if (!parsed.success) return
    assert.equal(parsed.data.accidentFree, false)
    assert.equal(parsed.data.imported, undefined)
    assert.equal(parsed.data.safetyFeatures, undefined)
  })

  it('strips vehicle null numeric fields', () => {
    const parsed = vehicleSchema.safeParse({
      title: 'Car',
      vehicleId: 'C-2',
      listingType: 'Both',
      vehicleCategory: 'SUV',
      make: 'Toyota',
      vehicleModel: 'Land Cruiser',
      manufacturingYear: 2019,
      color: 'White',
      countryOfOrigin: 'Japan',
      condition: 'Used',
      region: 'AA',
      city: 'AA',
      price: 4500000,
      priceType: 'Negotiable',
      engineSize: null,
      mileage: '65000',
      dailyRate: null,
      driverIncluded: null,
    })
    assert.ok(parsed.success)
    if (!parsed.success) return
    assert.equal(parsed.data.mileage, 65000)
    assert.equal(parsed.data.engineSize, undefined)
    assert.equal(parsed.data.dailyRate, undefined)
    assert.equal(parsed.data.driverIncluded, undefined)
  })
})

describe('auth schemas', () => {
  it('register requires valid email and 8+ char password', () => {
    assert.equal(registerSchema.safeParse({ username: 'ab', email: 'a@b.com', password: 'short' }).success, false)
    assert.ok(registerSchema.safeParse({ username: 'agent', email: 'a@b.com', password: 'password123' }).success)
  })

  it('login requires non-empty password', () => {
    assert.equal(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success, false)
  })
})
