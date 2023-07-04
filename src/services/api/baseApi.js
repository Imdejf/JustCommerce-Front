import { APISettings } from './config.js'
import Cookies from 'universal-cookie'

export const CreateBaseApiService = (resource) => {
  const cookie = new Cookies()
  const store = cookie.get('dsStore')

  return {
    filterList: (storeId, searchString, pageNumber, pageSize) => {
      return new Promise((resolve, reject) => {
        const params = new URLSearchParams()
        params.append('storeId', storeId)
        params.append('searchString', searchString)
        params.append('pageNumber', pageNumber)
        params.append('pageSize', pageSize)

        const url = `${APISettings.baseURL}${resource}?${params.toString()}`

        fetch(url, {
          method: 'GET'
        })
          .then(async function (response) {
            if (response.status != 200) {
              reject(response.status)
            } else {
              const json = await response.json()
              resolve(json.data)
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    // Get a list of resources
    list: (config) =>
      fetch(`${APISettings.baseURL}${resource}`, { method: 'GET', ...config }).then(function (
        response
      ) {
        if (response.status != 200) {
          throw response.status
        } else {
          return response.json()
        }
      }),
    listByStoreId: (config) => {
      return new Promise((resolve, reject) => {
        const params = new URLSearchParams()
        params.append('storeId', store)

        const url = `${APISettings.baseURL}${resource}?${params.toString()}`

        fetch(url, {
          method: 'GET',
          ...config
        })
          .then(async function (response) {
            if (response.status != 200) {
              reject(response.status)
            } else {
              const json = await response.json()
              resolve(json.data)
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    // Get a single resource by its id
    get: (id, config) =>
      fetch(`${APISettings.baseURL}${resource}/${id}`, { method: 'GET', ...config }).then(function (
        response
      ) {
        if (response.status != 200) {
          throw response.status
        } else {
          return response.json()
        }
      }),
    // Create a new resource
    create: (payload) =>
      fetch(`${APISettings.baseURL}${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...payload
      }).then(function (response) {
        if (response.status != 200) {
          throw response.status
        } else {
          return response.json()
        }
      }),
    // Replace an existing resource with payload
    update: (payload) =>
      fetch(`${APISettings.baseURL}${resource}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        ...payload
      }).then(function (response) {
        if (response.status != 200) {
          throw response.status
        } else {
          return response.json()
        }
      }),
    // Merge new payload into a resource
    patch: (id, payload) =>
      fetch(`${APISettings.baseURL}${resource}/${id}`, { method: 'PATCH', ...payload }).then(
        function (response) {
          if (response.status != 200) {
            throw response.status
          } else {
            return response.json()
          }
        }
      ),
    // Remove a resource by its id
    remove: (id) =>
      fetch(`${APISettings.baseURL}${resource}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      }).then(function (response) {
        if (response.status != 200) {
          throw response.status
        } else {
          return response.json()
        }
      })
  }
}
