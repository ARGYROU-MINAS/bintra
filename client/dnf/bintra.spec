Name:           bintra
Version:        1.0.4
Release:        1%{?dist}
Summary:        Binary Transparency check on package install
Vendor:	        Kai KRETSCHMANN
Packager:       Kai KRETSCHMANN <kai@kretschmann.consulting>
Group:          Applications/System
License:        MIT
URL:            https://bintra.directory/
Source0:        https://gitlab.kretschmann.software/kai/bintra/-/archive/master/bintra-master.tar.gz

BuildArch:      noarch

Requires:       python3
Requires:       dnf-plugins-core

%description
Binary Transparency check on package install

%prep
cd %{_sourcedir}
rm -rf %{name}
git clone --depth=1 https://gitlab.kretschmann.software/kai/bintra.git
%global __python /usr/bin/python3
%global python_sitelib %(%{__python} -c "from distutils.sysconfig import get_python_lib; print(get_python_lib())")

%build

%install
mkdir -p %{buildroot}%{python_sitelib}/dnf-plugins
mkdir -p %{buildroot}/etc/dnf/plugins
cp %{_sourcedir}/%{name}/client/dnf/%{name}.py %{buildroot}%{python_sitelib}/dnf-plugins/
mkdir -p %{buildroot}%{_licensedir}/%{name}
cp %{_sourcedir}/%{name}/LICENSE %{buildroot}%{_licensedir}/%{name}/
echo "[main]" >%{buildroot}/etc/dnf/plugins/%{name}.conf
echo "enable=true" >>%{buildroot}/etc/dnf/plugins/%{name}.conf
echo "JWT=" >>%{buildroot}/etc/dnf/plugins/%{name}.conf
echo "BADCOUNT=1" >>%{buildroot}/etc/dnf/plugins/%{name}.conf
exit 0

%clean
rm -rf $RPM_BUILD_ROOT

%post
pip3 install requests
pip3 install ppretty

%files
%license %{_licensedir}/%{name}/LICENSE
%{python_sitelib}/dnf-plugins/%{name}.py
%config(noreplace) /etc/dnf/plugins/%{name}.conf


%changelog
* Sat Apr 24 2021 Kai KRETSCHMANN <kai@kretschmann.consulting>
- 
