import { Api } from './admin.js';

export class PostDraft {
  /** @param {github.GetContentFileResponse} opts */
  constructor({
    name,
    path,
  }) {
    this.name = name;
    this.filepath = path;
  }
}

PostDraft.list = async () => {
  try {
    /** @type {github.GetContentFolderResponse} */
    const res = await new Api().makeRequest(`/contents/_drafts`);
    return res.map(d => new PostDraft(d));
  } catch (err) {
    if (err instanceof Api.ResponseError && err.status === 404) {
      return [];
    }
    throw err;
  }
};
