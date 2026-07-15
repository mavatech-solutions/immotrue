export class ListingOfflineError extends Error {
  constructor(message = 'Listing is no longer available') {
    super(message)
    this.name = 'ListingOfflineError'
  }
}

export class UnsupportedPortalError extends Error {
  constructor(message = 'Portal not yet supported') {
    super(message)
    this.name = 'UnsupportedPortalError'
  }
}
