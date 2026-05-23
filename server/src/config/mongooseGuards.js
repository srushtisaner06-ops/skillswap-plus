const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const UPDATE_QUERY_HOOKS = ['updateOne', 'updateMany', 'findOneAndUpdate'];

function rejectArrayUpdates(schema) {
  schema.pre(UPDATE_QUERY_HOOKS, function rejectArrayUpdate() {
    const update = this.getUpdate();
    const options = this.getOptions ? this.getOptions() : this.options || {};

    if (Array.isArray(update) && !options.updatePipeline) {
      throw new AppError(
        'Invalid update payload: array updates are only allowed with updatePipeline: true for intentional aggregation pipeline updates.',
        400
      );
    }
  });
}

mongoose.plugin(rejectArrayUpdates);
