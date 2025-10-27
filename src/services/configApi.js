import { dataAPI } from './api';

/**
 * Configuration API service
 * Handles all configuration-related API calls
 */
export const configAPI = {
  // Get table column configurations
  columns: {
    permohonan: () => dataAPI.getPermohonanColumns(),
    beritaAcara: () => dataAPI.getBeritaAcaraColumns(),
  },

  // Get UI display configurations
  display: {
    statusProperties: () => dataAPI.getStatusDisplayProperties(),
  },

  // Get business rule configurations
  rules: {
    deletableStatuses: () => dataAPI.getBeritaAcaraDeletableStatuses(),
  },

  // Convenience method to fetch all config data at once
  getAllConfigs: async () => {
    try {
      const [
        permohonanColumns,
        beritaAcaraColumns,
        statusProperties,
        deletableStatuses
      ] = await Promise.all([
        dataAPI.getPermohonanColumns(),
        dataAPI.getBeritaAcaraColumns(),
        dataAPI.getStatusDisplayProperties(),
        dataAPI.getBeritaAcaraDeletableStatuses()
      ]);

      return {
        data: {
          success: true,
          data: {
            columns: {
              permohonan: permohonanColumns.data.data,
              beritaAcara: beritaAcaraColumns.data.data
            },
            display: {
              statusProperties: statusProperties.data.data
            },
            rules: {
              deletableStatuses: deletableStatuses.data.data
            }
          }
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          message: 'Failed to fetch configuration data',
          data: {}
        }
      };
    }
  }
};

export default configAPI;
