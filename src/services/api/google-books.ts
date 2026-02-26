import type { ExternalBook, GoogleBooksItem } from "@/types";

const BASE_URL = "https://www.googleapis.com/books/v1";
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

export class BooksService {
  async searchBooks(query: string): Promise<ExternalBook[]> {
    const response = await fetch(
      `${BASE_URL}/volumes?q=intitle:${query}&maxResults=10&key=${API_KEY}`
    );
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((item: GoogleBooksItem) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || [],
      thumbnail: item.volumeInfo.imageLinks?.thumbnail || null,
      description: item.volumeInfo.description || "",
      pageCount: item.volumeInfo.pageCount,
      isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier,
      year: item.volumeInfo.publishedDate
        ? new Date(item.volumeInfo.publishedDate).getFullYear()
        : null,
    }));
  }

  async getBookById(id: string): Promise<ExternalBook> {
    const response = await fetch(`${BASE_URL}/volumes/${id}?key=${API_KEY}`);
    if (response.status === 404 || response.status === 400) {
      throw new Error('NOT_FOUND')
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    const item = await response.json();

    return {
      id: item.id,
      title: item.volumeInfo.title,
      language: item.volumeInfo.language,
      publisher: item.volumeInfo.publisher,
      mainCategory: item.volumeInfo.mainCategory,
      categories: item.volumeInfo.categories,
      averageRating: item.volumeInfo.averageRating,
      previewLink: item.volumeInfo.previewLink,
      infoLink: item.volumeInfo.infoLink,
      canonicalVolumeLink: item.volumeInfo.canonicalVolumeLink,
      authors: item.volumeInfo.authors || [],
      thumbnail: item.volumeInfo.imageLinks?.thumbnail || null,
      description: item.volumeInfo.description || "",
      pageCount: item.volumeInfo.pageCount,
      isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier,
      publishedDate: item.volumeInfo.publishedDate,
    };
  }
}

export const booksService = new BooksService();
