import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportProductsModal from './ImportProductsModal';

describe('ImportProductsModal', () => {
  const onClose = jest.fn();
  const onImport = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    onImport.mockClear();
  });

  test('renders correctly when open', () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    expect(screen.getByText(/Import Sản phẩm từ CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Tải template mẫu/i)).toBeInTheDocument();
    expect(screen.getByText(/Chọn file CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Hủy/i)).toBeInTheDocument();
    expect(screen.getByText(/Import/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    const { container } = render(<ImportProductsModal open={false} onClose={onClose} onImport={onImport} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('selecting a valid CSV updates file state and clears errors', () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    const file = new File(['code,name,price,quantity\nSP001,Product1,100,10'], 'products.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/Chọn file CSV/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/File đã chọn: products.csv/i)).toBeInTheDocument();
    expect(screen.queryByText(/Chỉ chấp nhận file CSV/i)).not.toBeInTheDocument();
  });

  test('selecting an invalid file type sets error message', () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    const file = new File(['dummy content'], 'dummy.txt', { type: 'text/plain' });

    const input = screen.getByLabelText(/Chọn file CSV/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Chỉ chấp nhận file CSV/i)).toBeInTheDocument();
    expect(screen.queryByText(/File đã chọn:/i)).not.toBeInTheDocument();
  });

  test('clicking "Tải template mẫu" downloads the correct CSV template', () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    const createElementSpy = jest.spyOn(document, 'createElement');
    const clickMock = jest.fn();
    const appendChildMock = jest.fn();
    const removeChildMock = jest.fn();

    createElementSpy.mockImplementation(() => ({
      href: '',
      download: '',
      click: clickMock,
    }));
    document.body.appendChild = appendChildMock;
    document.body.removeChild = removeChildMock;

    fireEvent.click(screen.getByText(/Tải template mẫu/i));

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickMock).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
  });

  test('importing without selecting a file sets error message', () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    fireEvent.click(screen.getByText(/Import/i));
    expect(screen.getByText(/Vui lòng chọn file CSV/i)).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('importing a correctly formatted CSV calls onImport and closes modal', async () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    const fileContent = 'code,name,price,quantity\nSP001,Product1,100,10';
    const file = new File([fileContent], 'products.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/Chọn file CSV/i);
    fireEvent.change(input, { target: { files: [file] } });

    const readAsTextMock = jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function () {
      this.onload({ target: { result: fileContent } });
    });

    fireEvent.click(screen.getByText(/Import/i));

    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith([
        { code: 'SP001', name: 'Product1', price: 100, quantity: 10 }
      ]);
      expect(onClose).toHaveBeenCalled();
    });

    readAsTextMock.mockRestore();
  });

  test('importing CSV with missing headers sets error message', async () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    const fileContent = 'code,name,price\nSP001,Product1,100';
    const file = new File([fileContent], 'products.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/Chọn file CSV/i);
    fireEvent.change(input, { target: { files: [file] } });

    const readAsTextMock = jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function () {
      this.onload({ target: { result: fileContent } });
    });

    fireEvent.click(screen.getByText(/Import/i));

    const errorMsg = await screen.findByText(/File CSV không đúng định dạng. Vui lòng tải template mẫu./i);
    expect(errorMsg).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    readAsTextMock.mockRestore();
  });

  test('importing CSV with invalid price/quantity sets error message', async () => {
    render(<ImportProductsModal open={true} onClose={onClose} onImport={onImport} />);
    const fileContent = 'code,name,price,quantity\nSP001,Product1,invalid,10';
    const file = new File([fileContent], 'products.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/Chọn file CSV/i);
    fireEvent.change(input, { target: { files: [file] } });

    const readAsTextMock = jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function () {
      this.onload({ target: { result: fileContent } });
    });

    fireEvent.click(screen.getByText(/Import/i));

    const errorMsg = await screen.findByText(/Giá hoặc số lượng không hợp lệ/i);
    expect(errorMsg).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    readAsTextMock.mockRestore();
  });

  // Additional edge case tests can be added similarly
});
