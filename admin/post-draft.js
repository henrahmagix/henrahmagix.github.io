import { Api } from '/admin/admin.js';
import { createHTML } from '/admin/utils.js';

export class PostDraft {
  constructor(d) {
    this.name = d.name;
    this.filepath = d.path;

    const params = new URLSearchParams();
    params.set('filepath', this.filepath);
    this.el = createHTML(`<a href="/admin/edit?${params}">${this.name}</a>`);
  }
}

PostDraft.list = async () => {
  try {
    const res = await new Api().makeRequest(`/contents/_drafts`);
    return res.map(d => new PostDraft(d));
  } catch (err) {
    if (err.status === 404) {
      return [];
    }
    throw err;
  }
};
