import React, { useEffect, useState } from "react";
import useStore from "../store";
import { API_URI } from "../utils";

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
};

const ShareLogs = () => {
  const token = useStore((s) => s.user?.token);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("");
  const [postFilter, setPostFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const buildQuery = (p = 1) => {
    const parts = [`page=${p}`, `limit=${limit}`];
    if (platform) parts.push(`platform=${encodeURIComponent(platform)}`);
    if (postFilter) parts.push(`post=${encodeURIComponent(postFilter)}`);
    if (startDate) parts.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) parts.push(`endDate=${encodeURIComponent(endDate)}`);
    return parts.join('&');
  };

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const qs = buildQuery(p);
      const res = await fetch(`${API_URI}/admin/share-logs?${qs}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const j = await res.json();
      if (j.success) {
        setLogs(j.data || []);
        setTotal(j.meta?.total || 0);
        setPage(j.meta?.page || p);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('fetch share logs error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full flex flex-col p-6">
      <h2 className='section-header'>Share Logs Analytics</h2>

      <div className='mb-6 section-container'>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Filters</h3>
        <div className='flex gap-3 items-end flex-wrap'>
          <div className="flex-1 min-w-48">
            <label className='form-label'>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className='input-modern'>
              <option value=''>Any</option>
              <option value='twitter'>Twitter</option>
              <option value='facebook'>Facebook</option>
              <option value='whatsapp'>WhatsApp</option>
              <option value='native'>Native</option>
              <option value='copy'>Copy</option>
              <option value='unknown'>Unknown</option>
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label className='form-label'>Post ID / Slug</label>
            <input value={postFilter} onChange={(e) => setPostFilter(e.target.value)} placeholder='post id or slug' className='input-modern' />
          </div>

          <div className="flex-1 min-w-48">
            <label className='form-label'>Start Date</label>
            <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className='input-modern' />
          </div>

          <div className="flex-1 min-w-48">
            <label className='form-label'>End Date</label>
            <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className='input-modern' />
          </div>

          <div className='flex gap-2'>
            <button onClick={() => fetchLogs(1)} className='btn-primary'>Apply Filters</button>
            <button onClick={() => { setPlatform(''); setPostFilter(''); setStartDate(''); setEndDate(''); fetchLogs(1); }} className='btn-secondary'>Reset</button>
          </div>
        </div>
      </div>

      <div className='table-container overflow-x-auto flex-1 mb-4'>
        <table className='w-full text-left'>
          <thead className='bg-slate-100 dark:bg-slate-700'>
            <tr>
              <th className='px-4 py-3 text-slate-900 dark:text-white font-semibold'>Date</th>
              <th className='px-4 py-3 text-slate-900 dark:text-white font-semibold'>Post</th>
              <th className='px-4 py-3 text-slate-900 dark:text-white font-semibold'>Platform</th>
              <th className='px-4 py-3 text-slate-900 dark:text-white font-semibold'>Method</th>
              <th className='px-4 py-3 text-slate-900 dark:text-white font-semibold'>User</th>
              <th className='px-4 py-3 text-slate-900 dark:text-white font-semibold'>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center muted'>Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center muted'>No share logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className='border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors'>
                  <td className='px-4 py-3 text-slate-900 dark:text-white text-sm'>{formatDate(log.createdAt)}</td>
                  <td className='px-4 py-3'>
                    {log.post ? (
                      <a
                        href={`/posts/${log.post.slug || log.post._id}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-blue-600 dark:text-blue-400 hover:underline font-semibold'
                      >
                        {log.post.title || log.post.slug}
                      </a>
                    ) : (
                      <span className='text-sm muted'>—</span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-slate-900 dark:text-white'>
                    <span className='inline-block bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-sm font-medium'>{log.platform || 'unknown'}</span>
                  </td>
                  <td className='px-4 py-3 text-slate-900 dark:text-white'>{log.method || 'copy'}</td>
                  <td className='px-4 py-3 text-slate-900 dark:text-white'>
                    {log.user ? `${log.user.name || log.user.email}` : <span className='text-sm muted'>anonymous</span>}
                  </td>
                  <td className='px-4 py-3 muted text-sm font-mono'>{log.ip || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='section-container flex items-center justify-between'>
        <div className='muted font-semibold'>Total: <span className='text-slate-900 dark:text-white'>{total}</span> logs</div>
        <div className='flex gap-2'>
          <button
            disabled={page <= 1}
            onClick={() => fetchLogs(Math.max(1, page - 1))}
            className='px-4 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            ← Prev
          </button>
          <span className='flex items-center muted'>Page {page}</span>
          <button
            disabled={page * limit >= total}
            onClick={() => fetchLogs(page + 1)}
            className='px-4 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLogs;
